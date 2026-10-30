package com.example.chatku.model;

import com.google.gson.annotations.SerializedName;

public class Message {

    @SerializedName("id")
    public long id;

    @SerializedName("conversation_id")
    public long conversationId;

    @SerializedName("sender_id")
    public long senderId;

    @SerializedName("message_type")
    public String messageType;

    @SerializedName("message_text")
    public String messageText;

    @SerializedName("reply_to_message_id")
    public Long replyToMessageId;

    @SerializedName("is_edited")
    public int isEdited;

    @SerializedName("is_deleted")
    public int isDeleted;

    @SerializedName("created_at")
    public String createdAt;

    @SerializedName("updated_at")
    public String updatedAt;

    @SerializedName("phone")
    public String phone;

    @SerializedName("full_name")
    public String fullName;

    @SerializedName("username")
    public String username;

    @SerializedName("avatar_url")
    public String avatarUrl;

    @SerializedName("is_verified")
    public int isVerified;


    public Message() {
    }


    public boolean isMine(long currentUserId) {

        return senderId == currentUserId;
    }


    public String getDisplayText() {

        if (isDeleted == 1) {
            return "Pesan telah dihapus";
        }

        if (messageText == null ||
                messageText.trim().isEmpty()) {

            return "";
        }

        return messageText;
    }


    public String getSenderName() {

        if (fullName != null &&
                !fullName.trim().isEmpty()) {

            return fullName;
        }

        if (username != null &&
                !username.trim().isEmpty()) {

            return "@" + username;
        }

        if (phone != null &&
                !phone.trim().isEmpty()) {

            return phone;
        }

        return "Pengguna ChatKu";
    }


    public boolean isDeleted() {

        return isDeleted == 1;
    }


    public boolean isEdited() {

        return isEdited == 1;
    }
}