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

        status_map = {'todo': 'To Do', 'in_progress': 'In Progress', 'done': 'Done'}
        priority_map = {'low': 'Low', 'medium': 'Medium', 'high': 'High'}

        for t in qs:
            ws.append([
                _safe_excel_value(t.title),
                status_map.get(t.status, t.status),
                priority_map.get(t.priority, t.priority),
                t.due_date,
                _safe_excel_value(t.description or ''),
                t.created_at.strftime('%d.%m.%Y'),
            ])

        for col in ws.columns:
            max_len = max(len(str(c.value)) if c.value is not None else 0 for c in col)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

        for row in ws.iter_rows(min_row=2, min_col=4, max_col=4):
            for cell in row:
                if cell.value:
                    cell.number_format = 'DD.MM.YYYY'

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'tasks_{date.today().isoformat()}.xlsx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response