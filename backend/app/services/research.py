import time
import json
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.research import ResearchSession, ResearchMessage, Citation
from app.services.search import search_service
from app.services.llm import llm_service

class ResearchOrchestrator:
    def execute_research(
        self,
        db: Session,
        workspace_id: str,
        user_id: str,
        question: str,
        retrieval_mode: str = "hybrid",
        source_scope: str = "workspace",
        session_id: str = None
    ) -> ResearchSession:
        """
        Execute end-to-end evidence-grounded research pipeline:
        1. Retrieve relevant passages
        2. Ground answer and citations
        3. Persist session, user question, assistant answer, and citations
        """
        start_time = time.time()

        # Step 1: Retrieve passages
        passages, search_latency = search_service.search(
            db=db,
            workspace_id=workspace_id,
            query=question,
            mode=retrieval_mode,
            limit=8
        )

        # Step 2: Synthesize grounded response
        grounded = llm_service.generate_grounded_answer(
            question=question,
            passages=passages
        )

        total_latency_ms = int((time.time() - start_time) * 1000)

        # Step 3: Session persistence
        if session_id:
            session = db.execute(select(ResearchSession).where(ResearchSession.id == session_id)).scalar_one_or_none()
            if not session:
                session = ResearchSession(
                    id=session_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    title=question[:60]
                )
                db.add(session)
        else:
            session = ResearchSession(
                workspace_id=workspace_id,
                user_id=user_id,
                title=question[:60]
            )
            db.add(session)

        db.flush()

        # Add user question message
        user_msg = ResearchMessage(
            session_id=session.id,
            role="user",
            content=question,
            retrieval_mode=retrieval_mode,
            has_insufficient_evidence=False,
            has_contradiction=False,
            latency_ms=0
        )
        db.add(user_msg)
        db.flush()

        # Add assistant response message
        assistant_msg = ResearchMessage(
            session_id=session.id,
            role="assistant",
            content=grounded.answer,
            retrieval_mode=retrieval_mode,
            has_insufficient_evidence=grounded.has_insufficient_evidence,
            has_contradiction=grounded.has_contradiction,
            latency_ms=total_latency_ms,
            evidence_metadata=json.dumps({
                "passages_retrieved": len(passages),
                "search_latency_ms": search_latency,
                "contradiction_notes": grounded.contradiction_notes
            })
        )
        db.add(assistant_msg)
        db.flush()

        # Add citations
        for c in grounded.citations:
            citation_rec = Citation(
                message_id=assistant_msg.id,
                chunk_id=c.get("chunk_id"),
                citation_number=c["citation_number"],
                source_type=c["source_type"],
                source_title=c["source_title"],
                source_url=c.get("source_url"),
                page_number=c.get("page_number"),
                section_heading=c.get("section_heading"),
                excerpt=c["excerpt"],
                is_verified=c["is_verified"]
            )
            db.add(citation_rec)

        db.commit()
        db.refresh(session)
        return session

research_orchestrator = ResearchOrchestrator()
