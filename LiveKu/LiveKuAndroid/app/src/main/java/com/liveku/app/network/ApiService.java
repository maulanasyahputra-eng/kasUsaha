package com.liveku.app.network;

import com.google.gson.JsonObject;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface ApiService {

    // ==========================================
    // AUTH
    // ==========================================

    @POST("api/auth/register")
    Call<JsonObject> register(
            @Body JsonObject body
    );

    @POST("api/auth/login")
    Call<JsonObject> login(
            @Body JsonObject body
    );


    // ==========================================
    // WALLET
    // ==========================================

    @GET("api/wallet")
    Call<JsonObject> getWallet(
            @Header("Authorization") String token
    );


    // ==========================================
    // DEVELOPMENT TOPUP
    // ==========================================

    @POST("api/wallet/development-topup")
    Call<JsonObject> developmentTopup(
            @Header("Authorization") String token,
            @Body JsonObject body
    );


    // ==========================================
    // MIDTRANS PAYMENT
    // ==========================================

    @POST("api/payment/create")
    Call<JsonObject> createPayment(
            @Header("Authorization") String token,
            @Body JsonObject body
    );


    // ==========================================
    // DEPOSIT
    // ==========================================

    @POST("api/deposit")
    Call<JsonObject> createDeposit(
            @Header("Authorization") String token,
            @Body JsonObject body
    );


    // ==========================================
    // WITHDRAW
    // ==========================================

    @POST("api/withdraw")
    Call<JsonObject> createWithdraw(
            @Header("Authorization") String token,
            @Body JsonObject body
    );


    // ==========================================
    // LIVE ROOM
    // ==========================================

    // Ambil semua live yang sedang LIVE
    @GET("api/live")
    Call<JsonObject> getLiveRooms();


    // ==========================================
    // LIVE ROOM DETAIL
    // ==========================================

    @GET("api/live/{id}")
    Call<JsonObject> getLiveRoom(
            @Path("id") long roomId
    );


    // ==========================================
    // START LIVE
    // ==========================================

    @POST("api/live")
    Call<JsonObject> startLive(
            @Header("Authorization") String token,
            @Body JsonObject body
    );


    // ==========================================
    // END LIVE
    // ==========================================

    @POST("api/live/{id}/end")
    Call<JsonObject> endLive(
            @Header("Authorization") String token,
            @Path("id") long roomId
    );


    // ==========================================
    // UPDATE VIEWER
    // ==========================================

    @PUT("api/live/{id}/viewers")
    Call<JsonObject> updateViewerCount(
            @Path("id") long roomId,
            @Body JsonObject body
    );
}