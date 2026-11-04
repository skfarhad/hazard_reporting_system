from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.user.models import User
from apps.user.urls import USER_ULRS

client = APIClient()

user_prefix = '/api/user/'

FB_TOKEN_VALID = ''
FB_TOKEN_INVALID = ''


def create_user(username):
    user = User.objects.create(
        username=username, is_active=True,
        full_name='User1',
    )
    return user


class UserTestCase(TestCase):

    def setUp(self):
        self.valid_fb_phone_token1 = ''
        self.username1 = 'username1'
        self.username2 = 'username2'
        self.username3 = 'username3'
        self.username4 = 'username4'
        self.username5 = 'username5'
        self.username6 = 'username6'
        self.username7 = 'username7'
        self.username8 = 'username8'
        self.username9 = 'username9'
        self.username10 = 'username10'

    def test_signup_success(self):

        username = "newuser123"
        response = client.post(
            user_prefix + USER_ULRS['signup_api'],
            {
              'username': username,
              'fb_phone_token': FB_TOKEN_VALID,
              'password': 'password123'
            },
            format='json',
        )
        # print(response.data)
        # print(response.status_code)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_signup_fail_invalid_username(self):

        response = client.post(
            user_prefix + USER_ULRS['signup_api'],
            {
                'username': 'new user',
                'fb_phone_token': FB_TOKEN_VALID,
                'password': 'password'
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, 400)

    def test_signup_fail_invalid_password(self):

        response = client.post(
            user_prefix + USER_ULRS['signup_api'],
            {
                'username': 'new user',
                'fb_phone_token': FB_TOKEN_VALID,
                'password': '21'
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    # def test_signup_fail_invalid_token(self):
    #     # TODO: Add token generator class for authkit
    #     response = client.post(
    #         user_prefix + USER_ULRS['signup_api'],
    #         {
    #             'username': 'new user',
    #             'fb_phone_token': FB_TOKEN_INVALID,
    #         },
    #         format='json',
    #     )
    #     # print(response.data)
    #     self.assertEqual(response.status_code, 400)

    def test_login_success(self):
        manager1 = User.objects.create(username=self.username1)
        password = '1234567890'
        manager1.set_password(password)
        manager1.save()

        resp = client.post(
            user_prefix + USER_ULRS['login_password'],
            {
                'username': self.username1,
                'password': password,
            },
            format='json',
        )
        # print(response.data['jwt_token'])
        self.assertEqual(resp.status_code, 200)

    def test_login_fail(self):
        manager1 = User.objects.create(username=self.username1)
        password = '1234567890'
        manager1.set_password(password)
        manager1.save()

        response = client.post(
            user_prefix + USER_ULRS['login_password'],
            {
                'username': self.username2,
                'password': password,
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, 401)

        response = client.post(
            user_prefix + USER_ULRS['login_password'],
            {
                'username': self.username1,
                'password': 'wrong_pass',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, 401)

    def test_password_change_success(self):
        manager1 = User.objects.create(username=self.username1)
        password = '1234567890'
        manager1.set_password(password)
        manager1.save()

        client.force_authenticate(user=manager1)
        response = client.post(
            user_prefix + USER_ULRS['change_password'],
            {
                'old_password': password,
                'new_password': password + '123',
            },
            format='json',
        )
        client.force_authenticate(user=None)
        self.assertEqual(response.status_code, 200)

    def test_password_change_fail(self):
        manager1 = User.objects.create(username=self.username1)
        password = '1234567890'
        manager1.set_password(password)
        manager1.save()

        client.force_authenticate(user=manager1)
        response = client.post(
            user_prefix + USER_ULRS['change_password'],
            {
                'old_password': password + '123',
                'new_password': password + '123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)

        response = client.post(
            user_prefix + USER_ULRS['change_password'],
            {
                'old_password': password,
                'new_password': '123',
            },
            format='json',
        )
        response = client.post(
            user_prefix + USER_ULRS['change_password'],
            {
                'old_password': password,
                'new_password': password,
            },
            format='json',
        )
        client.force_authenticate(user=None)
        self.assertEqual(response.status_code, 406)

    def test_create_profile_success(self):
        user1 = create_user(self.username1)

        client.force_authenticate(user1)

        response = client.post(
            user_prefix + USER_ULRS['profile'],
            {
                'username': self.username2,
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = client.post(
            user_prefix + USER_ULRS['profile'],
            {
                'username': self.username4,
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_profile_fail_duplicate_username(self):
        user1 = create_user(self.username1)
        client.force_authenticate(user1)

        response = client.post(
            user_prefix + USER_ULRS['profile'],
            {
                'username': self.username1,
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)

    def test_edit_profile_success(self):
        user1 = create_user(self.username1)
        client.force_authenticate(user1)

        response = client.patch(
            user_prefix + USER_ULRS['profile_id'].replace('<int:pk>', str(user1.id)),
            {
                'username': self.username1,
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = client.patch(
            user_prefix + USER_ULRS['profile_id'].replace('<int:pk>', str(user1.id)),
            {
                'username': self.username4,
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_edit_profile_fail_username_length(self):
        user1 = create_user(self.username1)

        client.force_authenticate(user1)

        response = client.patch(
            user_prefix + USER_ULRS['profile_id'].replace('<int:pk>', str(user1.id)),
            {
                'username': 'user',
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_profile_fail_invalid_character(self):
        user1 = create_user(self.username1)

        client.force_authenticate(user1)

        response = client.patch(
            user_prefix + USER_ULRS['profile_id'].replace('<int:pk>', str(user1.id)),
            {
                'username': 'user_5',
                'full_name': 'agent1',
                'email': '',
                'phone': '+0881787XXXXXX',
            },
            format='json',
        )
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_profile_list(self):
        user1 = create_user(self.username1)
        user11 = create_user(self.username2)
        user11 = create_user(self.username3)

        user111 = create_user(self.username4)
        user112 = create_user(self.username5)
        user22 = create_user(self.username6)

        client.force_authenticate(user1)

        response = client.get(
            user_prefix + USER_ULRS['profile'],
            {

            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 6)
