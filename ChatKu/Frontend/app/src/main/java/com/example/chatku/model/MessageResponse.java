package com.example.chatku.model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class MessageResponse {

    @SerializedName("success")
    public boolean success;

    @SerializedName("message")
    public String message;

    @SerializedName("messages")
    public List<Message> messages;

    @SerializedName("message_data")
    public Message messageData;
}