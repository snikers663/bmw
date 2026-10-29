from datetime import date
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import TaskSerializer


def _safe_excel_value(value):
    if isinstance(value, str) and value.startswith(('=', '+', '-', '@')):
        return "'" + value
    return value


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(owner=self.request.user)

        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')

        if status_param:
            qs = qs.filter(status=status_param)
        if priority_param:
            qs = qs.filter(priority=priority_param)

        return qs.order_by('due_date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def export(self, request):
        qs = self.get_queryset()[:10000]

        wb = Workbook()
        ws = wb.active
        ws.title = 'Данные'

        headers = ['Название', 'Статус', 'Приоритет', 'Дедлайн', 'Описание', 'Создано']
        ws.append(headers)
        for cell in ws[1]:
            cell.font = Font(bold=True)
        ws.freeze_panes = 'A2'
        ws.auto_filter.ref = ws.dimensions

        status_map = {'todo': 'К выполнению', 'in_progress': 'В процессе', 'done': 'Выполнено'}
        priority_map = {'low': 'Низкий', 'medium': 'Средний', 'high': 'Высокий'}

        for t in qs:
            # ГЛАВНЫЙ ФИКС: убираем часовой пояс и делаем строку
            if t.due_date:
                clean_date = t.due_date.replace(tzinfo=None)
                due_str = clean_date.strftime('%d.%m.%Y %H:%M')
            else:
                due_str = ''

            if t.created_at:
                clean_created = t.created_at.replace(tzinfo=None)
                created_str = clean_created.strftime('%d.%m.%Y %H:%M')
            else:
                created_str = ''

            ws.append([
                _safe_excel_value(t.title),
                status_map.get(t.status, t.status),
                priority_map.get(t.priority, t.priority),
                due_str,
                _safe_excel_value(t.description or ''),
                created_str,
            ])

        # Безопасная настройка ширины колонок
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 4, 50)
            ws.column_dimensions[column].width = adjusted_width

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'tasks_{date.today().isoformat()}.xlsx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response
