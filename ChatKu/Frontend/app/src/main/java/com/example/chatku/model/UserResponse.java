package com.example.chatku.model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class UserResponse {

    @SerializedName("success")
    public boolean success;

    @SerializedName("message")
    public String message;

    @SerializedName("users")
    public List<User> users;


    public static class User {

        @SerializedName("id")
        public int id;

        @SerializedName("phone")
        public String phone;

        @SerializedName("username")
        public String username;

        @SerializedName("full_name")
        public String full_name;

        @SerializedName("avatar_url")
        public String avatar_url;

        /*
         * Database MySQL mengirim:
         *
         * 0 = belum verified
         * 1 = sudah verified
         *
         * Jadi JANGAN gunakan boolean.
         */
        @SerializedName("is_verified")
        public Integer verifiedValue;


        public User() {
        }


        /*
         * Helper untuk mengecek status verifikasi.
         */
        public boolean isVerified() {

            return verifiedValue != null
                    && verifiedValue == 1;
        }


        /*
         * Nama yang ditampilkan di aplikasi.
         *
         * Prioritas:
         * 1. full_name
         * 2. username
         * 3. phone
         * 4. Pengguna ChatKu
         */
        public String getDisplayName() {

            if (full_name != null
                    && !full_name.trim().isEmpty()) {

                return full_name.trim();
            }

            if (username != null
                    && !username.trim().isEmpty()) {

                return username.trim();
            }

            if (phone != null
                    && !phone.trim().isEmpty()) {

                return phone.trim();
            }

            return "Pengguna ChatKu";
        }


        /*
         * Username untuk ditampilkan.
         */
        public String getUsername() {

            if (username == null) {
                return "";
            }

            return username;
        }


        /*
         * Nomor telepon.
         */
        public String getPhone() {

            if (phone == null) {
                return "";
            }

            return phone;
        }


        /*
         * Nama lengkap.
         */
        public String getFullName() {

            if (full_name == null) {
                return "";
            }

            return full_name;
        }


        /*
         * Avatar.
         */
        public String getAvatarUrl() {

            if (avatar_url == null) {
                return "";
            }

            return avatar_url;
        }
    }
}
