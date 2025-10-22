/**
 * Chat Service API
 * Handles all chatbot-related operations with the FastAPI backend
 */

import { apiRequest } from '../utils/api';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
  session_id?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;           // Backend returns "message" not "user_message"
  assistant_message: ChatMessage;
  session_id: string;
}

/**
 * Send a message to the chatbot and get AI response
 * Backend: POST /api/v1/chat/message
 * 
 * @param message - The user's message
 * @param sessionId - Optional session ID. Creates new session if not provided
 * @returns The user message, AI response, and session ID
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string
): Promise<SendMessageResponse> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/message`;
  console.log('💬 Sending chat message:', { message, sessionId });
  
  const body: SendMessageRequest = { message };
  if (sessionId) {
    body.session_id = sessionId;
  }
  
  const response = await apiRequest<SendMessageResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  // Normalize response structure
  return {
    message: response.message,
    assistant_message: response.assistant_message,
    session_id: response.session_id,
  };
}

/**
 * Create a new chat session
 * Backend: POST /api/v1/chat/sessions
 * 
 * @param title - Optional title for the session
 * @returns The created chat session
 */
export async function createChatSession(title?: string): Promise<ChatSession> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/sessions`;
  console.log('➕ Creating new chat session:', title);
  
  return apiRequest<ChatSession>(url, {
    method: 'POST',
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
}

/**
 * Get all chat sessions for the current user
 * Backend: GET /api/v1/chat/sessions
 * 
 * @returns List of all chat sessions
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/sessions`;
  console.log('📋 Fetching chat sessions');
  
  return apiRequest<ChatSession[]>(url, {
    method: 'GET',
  });
}

/**
 * Get a specific chat session with all its messages
 * Backend: GET /api/v1/chat/sessions/{id}
 * 
 * @param sessionId - The session ID
 * @returns The chat session with all messages
 */
export async function getChatSession(sessionId: string): Promise<ChatSessionWithMessages> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/sessions/${sessionId}`;
  console.log('📖 Fetching chat session:', sessionId);
  
  return apiRequest<ChatSessionWithMessages>(url, {
    method: 'GET',
  });
}

/**
 * Update chat session title
 * Backend: PUT /api/v1/chat/sessions/{id}
 * 
 * @param sessionId - The session ID
 * @param title - New title for the session
 * @returns The updated chat session
 */
export async function updateChatSession(
  sessionId: string,
  title: string
): Promise<ChatSession> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/sessions/${sessionId}`;
  console.log('✏️ Updating chat session:', sessionId, title);
  
  return apiRequest<ChatSession>(url, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

/**
 * Delete a chat session
 * Backend: DELETE /api/v1/chat/sessions/{id}
 * 
 * @param sessionId - The session ID to delete
 * @returns Success message
 */
export async function deleteChatSession(sessionId: string): Promise<{ message: string }> {
  const url = `${process.env.API_BASE_URL}/api/v1/chat/sessions/${sessionId}`;
  console.log('🗑️ Deleting chat session:', sessionId);
  
  return apiRequest<{ message: string }>(url, {
    method: 'DELETE',
  });
}
