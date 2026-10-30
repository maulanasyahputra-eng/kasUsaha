package com.example.chatku.model;

public class AuthResponse {

    public boolean success;

    public String message;

    public String token;

    public int expires_in;

    public User user;


    public static class User {

        public long id;

        public String phone;

        public String full_name;

        public String username;

        public String avatar_url;

        public String bio;

        public boolean is_verified;

        public boolean is_admin;

        public String created_at;

        public String updated_at;
    }
}