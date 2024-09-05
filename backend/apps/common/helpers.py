from rest_framework.pagination import LimitOffsetPagination


def get_paginated(queryset, request, to_dict, limit=10):
    paginator = LimitOffsetPagination()
    paginator.max_limit = 50
    paginator.default_limit = limit
    paginator.offset = 0

    obj_list = paginator.paginate_queryset(
        queryset,
        request
    )

    results = to_dict(obj_list)

    next_link = paginator.get_next_link()
    prev_link = paginator.get_previous_link()
    if next_link:
        next_link = next_link.split('?')[1]
    if prev_link:
        prev_link = prev_link.split('?')[1]

    data = {
        'results': results,
        'limit': paginator.limit,
        'offset': paginator.offset,
        'count': paginator.count,
        'next': next_link,
        'prev': prev_link,
    }

    # print(json.dumps(data))

    return data
