from spello.model import SpellCorrectionModel

sp = SpellCorrectionModel(language="en")
    
def train():
    district_data_source = './data/districts.txt' # Can be any Data Source
    type = 'district'
    make_model(type,'', district_data_source)
    districts = get_train_data_from_file(district_data_source)
    if districts:
        for a_district in districts:
            type = 'thana'
            a_district = a_district.lower().replace(' ', '_')
            district_data_source = f'./data/thanas_{a_district}.txt'
            make_model(type, '_' + a_district, district_data_source)
    
def make_model(type ,model_name, data_source):
    data = get_train_data_from_file(data_source)
    if data:
        sp.train(data)
        sp.save(f'models/{type}{model_name}')

def get_train_data_from_file(file_name):
    try:
        with open(file_name, "r") as f:
            data = f.readlines()
            data = [x.strip() for x in data]
            return data
    except Exception as e:
        print("Training file is not Valid: ", e)
        return None
