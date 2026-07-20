import json
from datetime import UTC, datetime

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.llm.groq_client import GroqLLMService
from app.rag.rag_service import RAGService
from app.utils.language import resolve_language
from app.utils.medical import extract_medical_entities
from app.utils.object_id import object_id, serialize_document
from app.utils.sanitize import sanitize_text


class ChatService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.rag = RAGService(db)
        self.llm = GroqLLMService()

    async def answer(self, user_id: str, message: str, chat_id: str | None, language: str, top_k: int) -> dict:
        message = sanitize_text(message)
        chat = await self._get_or_create_chat(user_id, chat_id, message)
        history = chat.get("messages", [])
        
        from app.services.multi_agent_service import MultiAgentService
        agent_service = MultiAgentService(self.db)
        agent_name, matches, prompt = await agent_service.route_and_generate(user_id, message, history, language, top_k)
        answer, usage = await self.llm.complete(prompt, history)
        now = datetime.now(UTC)
        messages = [
            {"role": "user", "content": message, "created_at": now, "citations": []},
            {"role": "assistant", "content": answer, "created_at": now, "citations": matches},
        ]
        await self.db.chat_history.update_one(
            {"_id": chat["_id"]},
            {"$push": {"messages": {"$each": messages}}, "$set": {"updated_at": now}, "$inc": {"message_count": 2}},
        )
        entities = extract_medical_entities(f"{message}\n{answer}")
        await self.db.analytics.insert_one(
            {
                "event": "chat_completion",
                "user_id": user_id,
                "metadata": {"usage": usage, "question": message, "entities": entities},
                "created_at": now,
            }
        )
        return {"chat_id": str(chat["_id"]), "answer": answer, "citations": matches, "usage": usage}

    async def prepare_stream(self, user_id: str, message: str, chat_id: str | None, language: str, top_k: int) -> tuple[dict, list[dict], str, str]:
        message = sanitize_text(message)
        chat = await self._get_or_create_chat(user_id, chat_id, message)
        
        from app.services.multi_agent_service import MultiAgentService
        agent_service = MultiAgentService(self.db)
        agent_name, matches, prompt = await agent_service.route_and_generate(user_id, message, chat.get("messages", []), language, top_k)
        
        return chat, matches, prompt, agent_name

    async def save_streamed_response(self, chat_doc: dict, user_message: str, answer: str, matches: list[dict], suggestions: list[str] | None = None) -> None:
        now = datetime.now(UTC)
        await self.db.chat_history.update_one(
            {"_id": chat_doc["_id"]},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": user_message, "created_at": now, "citations": []},
                            {"role": "assistant", "content": answer, "created_at": now, "citations": matches, "suggestions": suggestions or []},
                        ]
                    }
                },
                "$set": {"updated_at": now},
                "$inc": {"message_count": 2},
            },
        )
        entities = extract_medical_entities(f"{user_message}\n{answer}")
        await self.db.analytics.insert_one(
            {
                "event": "chat_completion",
                "user_id": chat_doc["user_id"],
                "metadata": {"question": user_message, "entities": entities},
                "created_at": now,
            }
        )

    async def _get_or_create_chat(self, user_id: str, chat_id: str | None, first_message: str) -> dict:
        if chat_id:
            chat = await self.db.chat_history.find_one({"_id": object_id(chat_id), "user_id": user_id})
            if chat is None:
                raise HTTPException(status_code=404, detail="Chat not found")
            return chat
        now = datetime.now(UTC)
        doc = {
            "user_id": user_id,
            "title": first_message[:60],
            "pinned": False,
            "messages": [],
            "message_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.db.chat_history.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def history(self, user_id: str) -> list[dict]:
        chats = await self.db.chat_history.find({"user_id": user_id}, {"messages": 0}).sort([("pinned", -1), ("updated_at", -1)]).to_list(200)
        return [serialize_document(chat) for chat in chats]

    async def get_chat(self, chat_id: str, user_id: str) -> dict:
        chat = await self.db.chat_history.find_one({"_id": object_id(chat_id), "user_id": user_id})
        if chat is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        return serialize_document(chat)

    async def rename(self, chat_id: str, user_id: str, title: str) -> None:
        result = await self.db.chat_history.update_one({"_id": object_id(chat_id), "user_id": user_id}, {"$set": {"title": title, "updated_at": datetime.now(UTC)}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")

    async def pin(self, chat_id: str, user_id: str, pinned: bool) -> None:
        result = await self.db.chat_history.update_one({"_id": object_id(chat_id), "user_id": user_id}, {"$set": {"pinned": pinned}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")

    async def delete(self, chat_id: str, user_id: str) -> None:
        result = await self.db.chat_history.delete_one({"_id": object_id(chat_id), "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")

    async def search_chats(self, query: str, user_id: str) -> list[dict]:
        chats = await self.db.chat_history.find({"user_id": user_id, "$text": {"$search": query}}, {"score": {"$meta": "textScore"}, "messages": 0}).to_list(50)
        return [serialize_document(chat) for chat in chats]

    async def generate_starter_suggestions(self, user_id: str) -> list[str]:
        profile_doc = await self.db.risk_profiles.find_one({"user_id": user_id})
        profile = profile_doc.get("profile", {}) if profile_doc else {}
        prompt = (
            "You are a clinical AI assistant helping a patient. Based on their profile below, "
            "generate exactly 3 highly relevant and helpful questions they could ask you to start the conversation. "
            "The questions should be short, friendly, and directly related to their health data. "
            "Return ONLY a JSON object containing a 'suggestions' key which maps to an array of 3 string questions.\n\n"
            f"Patient Profile: {profile}"
        )
        try:
            if not self.llm.client:
                return []
            response = await self.llm.client.chat.completions.create(
                model=self.llm.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a clinical AI. Output a valid JSON object with a 'suggestions' array of strings."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            data = json.loads(response.choices[0].message.content)
            return data.get("suggestions", [])[:3]
        except Exception:
            return ["What do my latest lab results mean?", "How can I improve my health score?", "Are there any interactions with my medications?"]

    async def generate_follow_up_suggestions(self, chat_history: list[dict], last_response: str) -> list[str]:
        context = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history[-4:]])
        prompt = (
            "You are a clinical AI assistant. Based on the recent conversation history, "
            "suggest exactly 3 logical follow-up questions the patient could ask next to learn more or clarify. "
            "Return ONLY a JSON object containing a 'suggestions' key which maps to an array of 3 string questions.\n\n"
            f"Conversation History:\n{context}\n\nAI's Last Response:\n{last_response}"
        )
        try:
            if not self.llm.client:
                return []
            response = await self.llm.client.chat.completions.create(
                model=self.llm.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a clinical AI. Output a valid JSON object with a 'suggestions' array of strings."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            data = json.loads(response.choices[0].message.content)
            return data.get("suggestions", [])[:3]
        except Exception:
            return []
