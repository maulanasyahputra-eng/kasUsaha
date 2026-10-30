package com.example.chatku.model;

import com.google.gson.annotations.SerializedName;

public class Conversation {

    // =========================================
    // CONVERSATION
    // =========================================

    @SerializedName("id")
    public long id;

    @SerializedName("type")
    public String type;

    @SerializedName("title")
    public String title;

    @SerializedName("avatar_url")
    public String avatarUrl;

    @SerializedName("created_by")
    public long createdBy;

    @SerializedName("created_at")
    public String createdAt;


    // =========================================
    // LAST MESSAGE
    // =========================================

    @SerializedName("last_message")
    public String lastMessage;

    @SerializedName("last_message_at")
    public String lastMessageAt;


    // =========================================
    // OTHER USER
    // =========================================

    @SerializedName("other_user_id")
    public long otherUserId;

    @SerializedName("other_user_phone")
    public String otherUserPhone;

    @SerializedName("other_user_name")
    public String otherUserName;

    @SerializedName("other_username")
    public String otherUsername;

    @SerializedName("other_avatar")
    public String otherAvatar;


    // =========================================
    // VERIFIED
    // =========================================
    //
    // Backend MySQL mengirim 0 / 1.
    // Jangan gunakan boolean langsung karena
    // Gson bisa error jika response berupa NUMBER.
    //

    @SerializedName("other_is_verified")
    public Integer otherIsVerified;


    // =========================================
    // CONSTRUCTOR
    // =========================================

    public Conversation() {
    }


    // =========================================
    // DISPLAY NAME
    // =========================================

    public String getDisplayName() {

        if (
                otherUserName != null &&
                        !otherUserName.trim().isEmpty()
        ) {

            return otherUserName;

        }

        if (
                otherUsername != null &&
                        !otherUsername.trim().isEmpty()
        ) {

            return "@" + otherUsername;

        }

        if (
                otherUserPhone != null &&
                        !otherUserPhone.trim().isEmpty()
        ) {

            return otherUserPhone;

        }

        if (
                title != null &&
                        !title.trim().isEmpty()
        ) {

            return title;

        }

        return "Pengguna ChatKu";
    }


    // =========================================
    // LAST MESSAGE
    // =========================================

    public String getLastMessageText() {

        if (
                lastMessage != null &&
                        !lastMessage.trim().isEmpty()
        ) {

            return lastMessage;

        }

        return "Belum ada pesan";
    }


    // =========================================
    // AVATAR
    // =========================================

    public String getAvatarUrl() {

        if (
                otherAvatar != null &&
                        !otherAvatar.trim().isEmpty()
        ) {

            return otherAvatar;

        }

        if (
                avatarUrl != null &&
                        !avatarUrl.trim().isEmpty()
        ) {

            return avatarUrl;

        }

        return null;
    }


    // =========================================
    // VERIFIED
    // =========================================

    public boolean isVerified() {

        return otherIsVerified != null &&
                otherIsVerified == 1;
    }


    // =========================================
    // PRIVATE CHAT
    // =========================================

    public boolean isPrivate() {

        return "private".equalsIgnoreCase(type);
    }

}