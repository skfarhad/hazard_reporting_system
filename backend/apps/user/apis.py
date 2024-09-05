from rest_framework.permissions import IsAuthenticated

from .models import User
from apps.common.apis import CustomViewSet
from .serializers import ProfileSerializer


class ProfileViewSet(CustomViewSet):
    """
    retrieve:
        Return single object

        Response:
        ---
            {
                'id': 12,
                'username': 'username',
                'name': 'name1',
                'phone': '+88017XXXXXXXX',
                'image': 'url,
                'email': 'manager.email',
                'designation': 'MD'
            }

    list:
        Return object list

        Query parameters:
        ---
            role:
                type: int
                required: No
                choices: (1, type1), (2, type2), (0, type3)

            token:
                type: str
                required: No

        Sample Response:
        ---

            [
                {
                    //profile details
                },..
            ]

    create:
        Create object

        Sample Submit:
        ---
            {
                'username': 'user1',
                'full_name': 'name1',
                'phone': '+88017XXXXXXXX',
                'image': 'url',
                'email': 'manager.email',
                'designation': 'MD'
            }

    partial_update:
        Update single object

        Sample Submit:
        ---
            {
                // same as submit
            }

    paginated:
        Return paginated object list

        Sample response:
        ---
            {
                'limit': 10,
                'offset': 20,
                'count': 101,
                'next': 'limit=5&offset=30',
                'prev': 'limit=5&offset=10',
                'results': [
                    {
                        //same as details
                    },...
                ]
            }
    """
    permission_classes = (IsAuthenticated,)
    ObjModel = User
    ObjSerializer = ProfileSerializer
