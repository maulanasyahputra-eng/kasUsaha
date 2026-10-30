package com.example.chatku.adapter;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.R;
import com.example.chatku.model.Conversation;

import java.util.ArrayList;
import java.util.List;

public class ConversationAdapter
        extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {


    // ========================================
    // DATA
    // ========================================

    private final List<Conversation> conversations =
            new ArrayList<>();


    // ========================================
    // CLICK LISTENER
    // ========================================

    public interface OnConversationClickListener {

        void onConversationClick(
                Conversation conversation
        );

    }


    private final OnConversationClickListener listener;


    // ========================================
    // CONSTRUCTOR
    // ========================================

    public ConversationAdapter(
            OnConversationClickListener listener
    ) {

        this.listener = listener;

    }


    // ========================================
    // SET DATA
    // ========================================

    public void setConversations(
            List<Conversation> data
    ) {

        conversations.clear();

        if (data != null) {

            conversations.addAll(data);

        }

        notifyDataSetChanged();

    }


    // ========================================
    // GET ITEM
    // ========================================

    public Conversation getItem(
            int position
    ) {

        if (
                position < 0 ||
                        position >= conversations.size()
        ) {

            return null;

        }

        return conversations.get(position);

    }


    // ========================================
    // CREATE VIEW HOLDER
    // ========================================

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {

        View view =
                LayoutInflater.from(
                        parent.getContext()
                ).inflate(
                        R.layout.item_conversation,
                        parent,
                        false
                );

        return new ViewHolder(view);

    }


    // ========================================
    // BIND DATA
    // ========================================

    @Override
    public void onBindViewHolder(
            @NonNull ViewHolder holder,
            int position
    ) {

        Conversation conversation =
                conversations.get(position);


        // ====================================
        // NAMA
        // ====================================

        String displayName =
                conversation.getDisplayName();

        if (
                displayName == null ||
                        displayName.trim().isEmpty()
        ) {

            displayName = "Pengguna ChatKu";

        }

        holder.nameText.setText(
                displayName
        );


        // ====================================
        // VERIFIED
        // ====================================

        if (conversation.isVerified()) {

            holder.verifiedText.setVisibility(
                    View.VISIBLE
            );

        } else {

            holder.verifiedText.setVisibility(
                    View.GONE
            );

        }


        // ====================================
        // LAST MESSAGE
        // ====================================

        String lastMessage =
                conversation.getLastMessageText();

        if (
                lastMessage == null ||
                        lastMessage.trim().isEmpty()
        ) {

            lastMessage = "Belum ada pesan";

        }

        holder.lastMessageText.setText(
                lastMessage
        );


        // ====================================
        // TIME
        // ====================================

        if (
                conversation.lastMessageAt != null
                        &&
                        !conversation.lastMessageAt
                                .trim()
                                .isEmpty()
        ) {

            holder.timeText.setText(
                    conversation.lastMessageAt
            );

        } else {

            holder.timeText.setText(
                    ""
            );

        }


        // ====================================
        // AVATAR
        // ====================================

        setupAvatar(
                holder.avatarImage,
                displayName
        );


        // ====================================
        // ONLINE DOT
        // ====================================

        if (holder.onlineDot != null) {

            /*
             * Belum ada field online pada model
             * Conversation.
             *
             * Sementara disembunyikan agar tidak
             * memberikan status online palsu.
             */

            holder.onlineDot.setVisibility(
                    View.GONE
            );

        }


        // ====================================
        // UNREAD BADGE
        // ====================================

        if (holder.unreadBadge != null) {

            /*
             * Belum ada unreadCount pada model
             * Conversation.
             *
             * Sementara disembunyikan.
             */

            holder.unreadBadge.setVisibility(
                    View.GONE
            );

        }


        // ====================================
        // CLICK
        // ====================================

        holder.itemView.setOnClickListener(
                v -> {

                    if (listener != null) {

                        listener.onConversationClick(
                                conversation
                        );

                    }

                }
        );

    }


    // ========================================
    // AVATAR
    // ========================================

    private void setupAvatar(
            ImageView imageView,
            String name
    ) {

        /*
         * Jangan lagi menggunakan:
         *
         * R.drawable.ic_launcher_foreground
         *
         * Karena itu membuat semua user terlihat
         * seperti icon aplikasi.
         *
         * Kita buat avatar bulat dengan warna
         * konsisten berdasarkan nama pengguna.
         */

        int color =
                getAvatarColor(name);


        GradientDrawable background =
                new GradientDrawable();

        background.setShape(
                GradientDrawable.OVAL
        );

        background.setColor(
                color
        );


        imageView.setBackground(
                background
        );


        /*
         * Untuk sementara icon aplikasi
         * dihilangkan.
         *
         * Nanti kalau sudah ada URL foto profil,
         * bagian ini bisa diganti Glide/Picasso.
         */

        imageView.setImageDrawable(
                null
        );


        /*
         * Pastikan gambar tetap bulat.
         */

        imageView.setClipToOutline(
                true
        );

    }


    // ========================================
    // AVATAR COLOR
    // ========================================

    private int getAvatarColor(
            String name
    ) {

        if (
                name == null ||
                        name.trim().isEmpty()
        ) {

            return Color.rgb(
                    34,
                    158,
                    217
            );

        }


        int hash =
                Math.abs(
                        name.hashCode()
                );


        /*
         * Beberapa warna yang masih terasa
         * seperti gaya Telegram.
         */

        int[][] colors = {

                {34, 158, 217},

                {76, 175, 80},

                {156, 39, 176},

                {255, 152, 0},

                {233, 30, 99},

                {0, 150, 136},

                {63, 81, 181},

                {121, 85, 72}

        };


        int[] selected =
                colors[
                        hash % colors.length
                        ];


        return Color.rgb(
                selected[0],
                selected[1],
                selected[2]
        );

    }


    // ========================================
    // ITEM COUNT
    // ========================================

    @Override
    public int getItemCount() {

        return conversations.size();

    }


    // ========================================
    // VIEW HOLDER
    // ========================================

    static class ViewHolder
            extends RecyclerView.ViewHolder {


        ImageView avatarImage;

        TextView nameText;

        TextView verifiedText;

        TextView lastMessageText;

        TextView timeText;

        View onlineDot;

        TextView unreadBadge;


        ViewHolder(
                @NonNull View itemView
        ) {

            super(itemView);


            avatarImage =
                    itemView.findViewById(
                            R.id.avatarImage
                    );


            nameText =
                    itemView.findViewById(
                            R.id.nameText
                    );


            verifiedText =
                    itemView.findViewById(
                            R.id.verifiedText
                    );


            lastMessageText =
                    itemView.findViewById(
                            R.id.lastMessageText
                    );


            timeText =
                    itemView.findViewById(
                            R.id.timeText
                    );


            onlineDot =
                    itemView.findViewById(
                            R.id.onlineDot
                    );


            unreadBadge =
                    itemView.findViewById(
                            R.id.unreadBadge
                    );

        }

    }

}