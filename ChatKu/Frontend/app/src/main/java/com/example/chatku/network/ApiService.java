package com.example.chatku.network;

import com.example.chatku.model.AuthResponse;
import com.example.chatku.model.ConversationResponse;
import com.example.chatku.model.UserResponse;

import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    // =========================================
    // OTP - SEND
    // =========================================

    @POST("api/otp/send")
    Call<AuthResponse> sendOtp(
            @Body Map<String, String> body
    );


    // =========================================
    // OTP - VERIFY
    // =========================================

    @POST("api/otp/verify")
    Call<AuthResponse> verifyOtp(
            @Body Map<String, String> body
    );


    // =========================================
    // AUTH - ME
    // =========================================

    @GET("api/auth/me")
    Call<AuthResponse> getMe(
            @Header("Authorization") String token
    );


    // =========================================
    // AUTH - LOGOUT
    // =========================================

    @POST("api/auth/logout")
    Call<AuthResponse> logout(
            @Header("Authorization") String token
    );


    // =========================================
    // USERS - SEARCH
    // =========================================
    //
    // Backend:
    // GET /api/users/search?keyword=maulana
    //
    // Header:
    // Authorization: Bearer TOKEN
    //

    @GET("api/users/search")
    Call<UserResponse> searchUsers(
            @Header("Authorization") String token,
            @Query("keyword") String keyword
    );


    // =========================================
    // CHAT - GET CONVERSATIONS
    // =========================================

    @GET("api/chat/conversations")
    Call<ConversationResponse> getConversations(
            @Header("Authorization") String token
    );


    // =========================================
    // CHAT - CREATE PRIVATE CONVERSATION
    // =========================================
    //
    // Body:
    // {
    //     "user_id": 2
    // }
    //

    @POST("api/chat/conversations")
    Call<ConversationResponse> createConversation(
            @Header("Authorization") String token,
            @Body Map<String, Object> body
    );


    // =========================================
    // CHAT - GET MESSAGES
    // =========================================

    @GET("api/chat/conversations/{id}/messages")
    Call<ConversationResponse> getMessages(
            @Header("Authorization") String token,
            @Path("id") long conversationId
    );


    // =========================================
    // CHAT - SEND MESSAGE
    // =========================================
    //
    // Body:
    // {
    //     "conversation_id": 1,
    //     "message": "Halo"
    // }
    //

    @POST("api/chat/messages")
    Call<ConversationResponse> sendMessage(
            @Header("Authorization") String token,
            @Body Map<String, Object> body
    );


    // =========================================
    // CHAT - DELETE MESSAGE
    // =========================================

    @DELETE("api/chat/messages/{id}")
    Call<ConversationResponse> deleteMessage(
            @Header("Authorization") String token,
            @Path("id") long messageId
    );

}