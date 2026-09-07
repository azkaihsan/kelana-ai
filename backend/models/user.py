from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    name          = Column(String,  nullable=False)
    email         = Column(String,  nullable=False, unique=True)
    password_hash = Column(String,  nullable=False)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
