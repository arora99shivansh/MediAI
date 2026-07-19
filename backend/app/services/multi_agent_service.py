import json
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.llm.groq_client import GroqLLMService
from app.rag.rag_service import RAGService
import logging

logger = logging.getLogger("mediai.agents")

class MultiAgentService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.llm = GroqLLMService()
        self.rag = RAGService(db)
        
    async def route_and_generate(self, user_id: str, message: str, chat_history: list[dict], language: str, top_k: int) -> tuple[str, list[dict], str]:
        """
        Determines the intent of the message and routes it to a specialized agent.
        Returns (AgentName, Citations, AnswerPrompt)
        """
        
        # 1. Intent Detection Agent
        router_prompt = (
            "You are a clinical routing agent. Classify the user's query into EXACTLY ONE of these categories:\n"
            "- 'medical_report': General questions about their uploaded medical reports, diagnoses, or general health.\n"
            "- 'smart_search': Specific queries asking 'When was my X highest?', 'Find every prescription for Y', or searching their history.\n"
            "- 'medication_safety': Questions specifically about drug interactions, side effects, or medications.\n"
            "- 'doctor_copilot': Questions preparing for a doctor visit or asking for a summary of their health.\n\n"
            f"User Query: {message}\n\n"
            "Reply with JUST the category name."
        )
        
        try:
            if self.llm.client:
                response = await self.llm.client.chat.completions.create(
                    model=self.llm.settings.groq_model,
                    messages=[{"role": "user", "content": router_prompt}],
                    temperature=0.0,
                    max_tokens=10
                )
                category = response.choices[0].message.content.strip().lower()
            else:
                category = "medical_report"
        except Exception:
            category = "medical_report"
            
        logger.info(f"Multi-Agent Router selected: {category}", extra={"user_id": user_id})
        
        # 2. Dispatch to Specialized Agents
        if category == "smart_search":
            return await self._agent_smart_search(user_id, message, language)
        elif category == "medication_safety":
            return await self._agent_medication(user_id, message, language)
        elif category == "doctor_copilot":
            return await self._agent_copilot(user_id, message, language)
        else:
            # Fallback to standard RAG
            return await self._agent_rag(user_id, message, language, top_k)
            
    async def _agent_rag(self, user_id: str, message: str, language: str, top_k: int) -> tuple[str, list[dict], str]:
        matches = await self.rag.search(message, user_id, top_k)
        prompt = self.rag.build_prompt(message, matches, language)
        return "Medical Report Agent", matches, prompt
        
    async def _agent_smart_search(self, user_id: str, message: str, language: str) -> tuple[str, list[dict], str]:
        # Fetch structured memory
        memory_docs = await self.db.health_memory.find({"user_id": user_id}).sort("created_at", -1).to_list(10)
        timeline_docs = await self.db.health_timeline.find({"user_id": user_id}).sort("date", -1).to_list(50)
        
        context = f"Health Memory:\n{json.dumps([m.get('extraction') for m in memory_docs], default=str)}\n\nTimeline:\n{json.dumps([t for t in timeline_docs if 'user_id' not in t], default=str)}"
        
        prompt = (
            f"Answer in {language}.\n"
            "You are the Smart Search Agent. Answer the user's specific query by searching their structured health history.\n"
            f"Context:\n{context}\n\nQuestion: {message}"
        )
        return "Smart Search Agent", [], prompt
        
    async def _agent_medication(self, user_id: str, message: str, language: str) -> tuple[str, list[dict], str]:
        meds = await self.db.medications.find({"user_id": user_id}).to_list(50)
        context = json.dumps([m for m in meds if "user_id" not in m], default=str)
        
        prompt = (
            f"Answer in {language}.\n"
            "You are the Medication Safety Agent. Analyze the user's current medication list for interactions, side effects, or answer their specific question about their meds.\n"
            f"Current Medications:\n{context}\n\nQuestion: {message}"
        )
        return "Medication Safety Agent", [], prompt
        
    async def _agent_copilot(self, user_id: str, message: str, language: str) -> tuple[str, list[dict], str]:
        profile = await self.db.risk_profiles.find_one({"user_id": user_id})
        context = json.dumps(profile.get("profile") if profile else {}, default=str)
        
        prompt = (
            f"Answer in {language}.\n"
            "You are the Doctor Visit Copilot Agent. The user is asking about preparing for a doctor's visit, or summarizing their health.\n"
            "Generate a clear, professional summary of their health risks and conditions, and suggest questions they should ask their doctor.\n"
            f"Digital Twin Profile:\n{context}\n\nQuestion: {message}"
        )
        return "Doctor Copilot Agent", [], prompt
