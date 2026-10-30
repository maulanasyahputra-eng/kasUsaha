package com.example.chatku.network;

import com.example.chatku.model.ConversationResponse;
import com.example.chatku.model.MessageResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Body;
import retrofit2.http.Path;

import java.util.Map;

public interface ChatApiService {

    // ========================================
    // DAFTAR CONVERSATION
    // ========================================

    @GET("api/chat/conversations")
    Call<ConversationResponse> getConversations(
            @Header("Authorization") String token
    );

    // ========================================
    // BUAT PRIVATE CHAT
    // ========================================

    @POST("api/chat/conversations")
    Call<ConversationResponse> createConversation(
            @Header("Authorization") String token,
            @Body Map<String, Object> body
    );

    // ========================================
    // AMBIL PESAN
    // ========================================

    @GET("api/chat/conversations/{id}/messages")
    Call<MessageResponse> getMessages(
            @Header("Authorization") String token,
            @Path("id") long conversationId
    );

    // ========================================
    // KIRIM PESAN
    // ========================================

    @POST("api/chat/messages")
    Call<MessageResponse> sendMessage(
            @Header("Authorization") String token,
            @Body Map<String, Object> body
    );
}