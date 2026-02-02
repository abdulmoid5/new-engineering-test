from rest_framework import serializers

from .models import Conversation, Message, Feedback


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "title", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "role", "text", "created_at", "sequence"]
        read_only_fields = ["id", "created_at", "sequence", "conversation", "role"]


class CreateMessageSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=1000, allow_blank=False, trim_whitespace=True)

    def validate_text(self, value: str) -> str:
        text = value.strip()
        if not text:
            raise serializers.ValidationError("Message text cannot be empty.")
        return text


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["id", "message", "value", "created_at"]
        read_only_fields = ["id", "message", "created_at"]


class CreateFeedbackSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=-1, max_value=5)

    def validate_value(self, value: int) -> int:
        if value == 0:
            raise serializers.ValidationError("Value cannot be 0; use -1/1 for thumbs or 1-5 for rating.")
        return value

