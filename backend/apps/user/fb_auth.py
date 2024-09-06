from firebase_admin import auth


def get_validated_phone(access_token):
    try:
        decoded_token = auth.verify_id_token(access_token)
        phone = decoded_token['phone_number']
        # uid = decoded_token['uid']
        return phone
    except Exception as e:
        # print(str(e))
        return None
