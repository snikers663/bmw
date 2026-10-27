from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'priority', 'due_date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Введите название (до 120 символов)')
        if len(value.strip()) > 120:
            raise serializers.ValidationError('Не более 120 символов')
        return value.strip()

    def validate_description(self, value):
        if value and len(value) > 2000:
            raise serializers.ValidationError('Не более 2000 символов')
        return value