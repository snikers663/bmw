from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None and response.status_code == status.HTTP_400_BAD_REQUEST:
        data = response.data
        if isinstance(data, dict) and 'errors' not in data:
            errors = {}
            for field, messages in data.items():
                if isinstance(messages, list):
                    errors[field] = ' '.join(str(m) for m in messages)
                else:
                    errors[field] = str(messages)
            response.data = {'errors': errors}
    return response