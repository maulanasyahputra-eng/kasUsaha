package com.example.chatku.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.R;
import com.example.chatku.model.Message;

import java.util.List;

public class MessageAdapter
        extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_SENT = 1;
    private static final int TYPE_RECEIVED = 2;

    private final List<Message> messages;
    private final long currentUserId;


    // =========================================
    // CONSTRUCTOR
    // =========================================

    public MessageAdapter(
            List<Message> messages,
            long currentUserId
    ) {

        this.messages = messages;
        this.currentUserId = currentUserId;
    }


    // =========================================
    // VIEW TYPE
    // =========================================

    @Override
    public int getItemViewType(int position) {

        Message message =
                messages.get(position);

        if (message.isMine(currentUserId)) {

            return TYPE_SENT;
        }

        return TYPE_RECEIVED;
    }


    // =========================================
    // CREATE HOLDER
    // =========================================

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {

        LayoutInflater inflater =
                LayoutInflater.from(
                        parent.getContext()
                );


        if (viewType == TYPE_SENT) {

            View view =
                    inflater.inflate(
                            R.layout.item_message_sent,
                            parent,
                            false
                    );

            return new SentViewHolder(view);
        }


        View view =
                inflater.inflate(
                        R.layout.item_message_received,
                        parent,
                        false
                );

        return new ReceivedViewHolder(view);
    }


    // =========================================
    // BIND
    // =========================================

    @Override
    public void onBindViewHolder(
            @NonNull RecyclerView.ViewHolder holder,
            int position
    ) {

        Message message =
                messages.get(position);


        if (
                holder instanceof SentViewHolder
        ) {

            SentViewHolder sentHolder =
                    (SentViewHolder) holder;


            sentHolder.messageText.setText(
                    message.getDisplayText()
            );


            return;
        }


        if (
                holder instanceof ReceivedViewHolder
        ) {

            ReceivedViewHolder receivedHolder =
                    (ReceivedViewHolder) holder;


            receivedHolder.senderText.setText(
                    message.getSenderName()
            );


            receivedHolder.messageText.setText(
                    message.getDisplayText()
            );
        }
    }


    // =========================================
    // COUNT
    // =========================================

    @Override
    public int getItemCount() {

        if (messages == null) {
            return 0;
        }

        return messages.size();
    }


    // =========================================
    // SENT HOLDER
    // =========================================

    static class SentViewHolder
            extends RecyclerView.ViewHolder {

        TextView messageText;


        SentViewHolder(
                @NonNull View itemView
        ) {

            super(itemView);


            messageText =
                    itemView.findViewById(
                            R.id.messageText
                    );
        }
    }


    // =========================================
    // RECEIVED HOLDER
    // =========================================

    static class ReceivedViewHolder
            extends RecyclerView.ViewHolder {

        TextView senderText;

        TextView messageText;


        ReceivedViewHolder(
                @NonNull View itemView
        ) {

            super(itemView);


            senderText =
                    itemView.findViewById(
                            R.id.senderText
                    );


            messageText =
                    itemView.findViewById(
                            R.id.messageText
                    );
        }
    }
}