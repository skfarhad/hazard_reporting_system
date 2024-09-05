import importlib
from dotenv import load_dotenv


def run_script(module_name):
    """
    Import and run the main function of a python module.
    """
    try:
        module = importlib.import_module(module_name)
        if hasattr(module, 'main'):
            module.main()
        else:
            print(f"No 'main' function found in {module_name}.")
            raise RuntimeError(
                f"Script {module_name} does not have a 'main' function.")
    except Exception as e:
        print(f"Error running {module_name}: {e}")
        raise


def main():
    load_dotenv()
    run_script('geojson_to_postgres')
    run_script('rename_db')


if __name__ == "__main__":
    main()
