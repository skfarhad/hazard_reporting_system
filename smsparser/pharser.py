from train import sp, get_train_data_from_file
from config import SEPARATOR, SPELLCHECK_DISTRICT, SPELLCHECK_THANA, SPELLCHECK_AREA
import json

districts = get_train_data_from_file('./data/districts.txt')


def get_correct_district(unknown_district):
    unknown_district = unknown_district.lower()
    sp.load('models/district/model.pkl')
    corrections = sp.spell_correct(unknown_district)
    return corrections.get('spell_corrected_text')

def get_correct_thana(unknown_thana, district):
    unknown_thana = unknown_thana.lower()
    district = district.lower()
    sp.load(f'models/thana_{district}/model.pkl')
    corrections = sp.spell_correct(unknown_thana)
    return corrections.get('spell_corrected_text')

def pharse_full(message):
    # Call this method to pharse full message
    # Feni#Parshuram#Govt. Primary School#Need Energrncy Medicine : Paracetamol
    message_parts = message.split(SEPARATOR)
    alert_message = load_location_data(message_parts)
    alert_message['message'] = message_parts[3]
    return json.dumps(alert_message)

def pharse_location(message):
    # Call this method to pharse only the location
    message_parts = message.split(SEPARATOR)
    alert_message = load_location_data(message_parts)
    return json.dumps(alert_message)
    
def load_location_data(message_parts):
    alert_message = {}
    alert_message['district'] = get_correct_district(message_parts[0]) if SPELLCHECK_DISTRICT else message_parts[0]
    alert_message['thana'] = get_correct_thana(message_parts[1], alert_message['district']) if SPELLCHECK_THANA and alert_message['district'].capitalize() in districts else message_parts[1]
    alert_message['area'] = message_parts[2] if SPELLCHECK_AREA else message_parts[2]
    return alert_message
                                                                                                      
    