package com.example.chatku.model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class ConversationResponse {

    @SerializedName("success")
    public boolean success;

    @SerializedName("message")
    public String message;

    @SerializedName("conversation_id")
    public long conversationId;

    @SerializedName("conversations")
    public List<Conversation> conversations;

    // Untuk response get messages
    @SerializedName("messages")
    public List<Message> messages;
}