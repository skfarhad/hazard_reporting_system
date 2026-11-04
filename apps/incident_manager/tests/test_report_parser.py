from django.test import SimpleTestCase

from apps.incident_manager.services.report_parser import MAX_REPORT_LENGTH, parse_report

KEYWORDS = {
    "rescue": "rescue", "uddhar": "rescue", "উদ্ধার": "rescue",
    "medical": "medical", "oshudh": "medical",
    "food": "food",
}


class ParseReportTests(SimpleTestCase):
    def test_a_report_starting_with_a_known_keyword_gets_that_need_and_the_location_parts(self):
        report = parse_report("RESCUE#Feni#Parshuram#Govt. Primary School#5 people on roof", KEYWORDS)

        self.assertEqual(report.need_codes, ["rescue"])
        self.assertEqual((report.district, report.thana, report.area), ("Feni", "Parshuram", "Govt. Primary School"))
        self.assertEqual(report.message, "5 people on roof")

    def test_several_keywords_joined_by_plus_or_comma_give_every_matching_need(self):
        self.assertEqual(parse_report("RESCUE+MEDICAL#Feni#P#S#m", KEYWORDS).need_codes, ["rescue", "medical"])
        self.assertEqual(parse_report("food, medical#Feni#P#S#m", KEYWORDS).need_codes, ["food", "medical"])

    def test_repeated_keywords_for_the_same_need_count_once(self):
        self.assertEqual(parse_report("rescue+uddhar#Feni#P#S#m", KEYWORDS).need_codes, ["rescue"])

    def test_keywords_match_regardless_of_case_and_surrounding_spaces(self):
        report = parse_report("  Rescue # Feni # Parshuram # School # help ", KEYWORDS)

        self.assertEqual(report.need_codes, ["rescue"])
        self.assertEqual((report.district, report.thana, report.area, report.message),
                         ("Feni", "Parshuram", "School", "help"))

    def test_banglish_and_bangla_keywords_match_the_same_need_as_english(self):
        self.assertEqual(parse_report("UDDHAR#Feni#P#S#m", KEYWORDS).need_codes, ["rescue"])
        self.assertEqual(parse_report("উদ্ধার#Feni#P#S#m", KEYWORDS).need_codes, ["rescue"])

    def test_an_unknown_keyword_gives_the_other_need_and_keeps_the_whole_text_as_the_message(self):
        text = "HELP#Feni#Parshuram#School#water rising"

        report = parse_report(text, KEYWORDS)

        self.assertEqual(report.need_codes, ["other"])
        self.assertEqual(report.message, text)
        self.assertEqual(report.district, "")

    def test_the_old_four_part_format_still_parses_its_location_and_gives_other(self):
        report = parse_report("Feni#Parshuram#Govt. Primary School#Need emergency medicine", KEYWORDS)

        self.assertEqual(report.need_codes, ["other"])
        self.assertEqual((report.district, report.thana, report.area), ("Feni", "Parshuram", "Govt. Primary School"))
        self.assertEqual(report.message, "Need emergency medicine")

    def test_a_hash_sign_inside_the_message_is_kept_as_part_of_the_message(self):
        report = parse_report("RESCUE#Feni#Parshuram#School#need boat #urgent", KEYWORDS)

        self.assertEqual(report.message, "need boat #urgent")

    def test_a_keyword_without_location_parts_keeps_the_rest_as_the_message(self):
        report = parse_report("rescue#we are on the roof", KEYWORDS)

        self.assertEqual(report.need_codes, ["rescue"])
        self.assertEqual(report.message, "we are on the roof")
        self.assertEqual(report.district, "")

    def test_empty_text_gives_other_and_an_empty_message(self):
        report = parse_report("", KEYWORDS)

        self.assertEqual(report.need_codes, ["other"])
        self.assertEqual(report.message, "")

    def test_text_longer_than_the_limit_is_truncated_before_parsing(self):
        report = parse_report("rescue#" + "x" * (MAX_REPORT_LENGTH * 2), KEYWORDS)

        self.assertEqual(report.need_codes, ["rescue"])
        self.assertLessEqual(len(report.message), MAX_REPORT_LENGTH)
