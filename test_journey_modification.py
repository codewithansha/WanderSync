"""
Unit tests for AI Journey Modification Engine
Tests all 10 acceptance criteria scenarios.
"""
import unittest
import copy
from decimal import Decimal
from services.journey_modification_service import modify_journey_engine
from utils.journey_revision import push_revision, pop_revision, get_revision_count, clear_revisions


def get_mock_journey():
    return {
        "trip_id": "test_trip_123",
        "trip": {
            "destination": "Dubai, United Arab Emirates",
            "destination_short": "Dubai",
            "destination_location": {"lat": 25.2048, "lng": 55.2708},
            "days": 3,
            "nights": 2,
            "travelers": 2,
            "budget": 3000,
            "currency": "USD",
            "currency_symbol": "$",
            "travel_style": "Balanced"
        },
        "summary": {
            "estimated_total": 2800.0,
            "target_budget": 3000.0,
            "remaining_budget": 200.0,
            "status": "within_budget",
            "percent_used": 93.3,
            "currency": "USD",
            "currency_symbol": "$"
        },
        "budget_breakdown": {
            "accommodation": 1200.0,
            "food": 600.0,
            "transportation": 300.0,
            "activities": 500.0,
            "miscellaneous": 200.0,
            "total": 2800.0
        },
        "days": [
            {
                "day_number": 1,
                "day_id": "1",
                "date": "2026-09-01",
                "date_display": "Tuesday, Sep 01",
                "title": "Iconic Dubai Marvels",
                "theme": "Landmarks",
                "activities": [
                    {
                        "place_id": "p1_1",
                        "title": "Dubai Mall",
                        "location": "Downtown Dubai",
                        "coordinates": {"lat": 25.1972, "lng": 55.2744},
                        "category": "Shopping",
                        "time": "10:00",
                        "end_time": "12:00",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 0,
                        "is_outdoor": False
                    },
                    {
                        "place_id": "p1_2",
                        "title": "Burj Khalifa Observation Deck",
                        "location": "1 Sheikh Mohammed bin Rashid Blvd",
                        "coordinates": {"lat": 25.1972, "lng": 55.2744},
                        "category": "Culture",
                        "time": "12:30",
                        "end_time": "14:30",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 50,
                        "is_outdoor": False
                    },
                    {
                        "place_id": "p1_3",
                        "title": "Zabeel Park",
                        "location": "Zabeel Area",
                        "coordinates": {"lat": 25.2285, "lng": 55.2974},
                        "category": "Nature",
                        "time": "15:00",
                        "end_time": "17:00",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 5,
                        "is_outdoor": True
                    },
                    {
                        "place_id": "p1_4",
                        "title": "Dubai Fountain Dinner",
                        "location": "Downtown Dubai",
                        "coordinates": {"lat": 25.1960, "lng": 55.2750},
                        "category": "Food",
                        "time": "19:00",
                        "end_time": "21:00",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 40,
                        "is_outdoor": True
                    }
                ]
            },
            {
                "day_number": 2,
                "day_id": "2",
                "date": "2026-09-02",
                "date_display": "Wednesday, Sep 02",
                "title": "Old Dubai & Culture",
                "theme": "Heritage",
                "activities": [
                    {
                        "place_id": "p2_1",
                        "title": "Dubai Museum & Al Fahidi",
                        "location": "Al Fahidi",
                        "coordinates": {"lat": 25.2631, "lng": 55.2972},
                        "category": "History",
                        "time": "09:30",
                        "end_time": "11:30",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 10,
                        "is_outdoor": False
                    },
                    {
                        "place_id": "p2_2",
                        "title": "Gold Souk Market",
                        "location": "Deira",
                        "coordinates": {"lat": 25.2711, "lng": 55.2975},
                        "category": "Shopping",
                        "time": "12:00",
                        "end_time": "14:00",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 0,
                        "is_outdoor": True
                    },
                    {
                        "place_id": "p2_3",
                        "title": "Miracle Garden",
                        "location": "Al Barsha South",
                        "coordinates": {"lat": 25.0597, "lng": 55.2444},
                        "category": "Nature",
                        "time": "15:00",
                        "end_time": "17:30",
                        "duration": "2 hr 30 min",
                        "duration_minutes": 150,
                        "estimated_cost": 20,
                        "is_outdoor": True
                    },
                    {
                        "place_id": "p2_4",
                        "title": "Desert Safari Adventure",
                        "location": "Lahbab Desert",
                        "coordinates": {"lat": 24.9600, "lng": 55.6100},
                        "category": "Adventure",
                        "time": "18:00",
                        "end_time": "21:30",
                        "duration": "3 hr 30 min",
                        "duration_minutes": 210,
                        "estimated_cost": 65,
                        "is_outdoor": True
                    }
                ]
            },
            {
                "day_number": 3,
                "day_id": "3",
                "date": "2026-09-03",
                "date_display": "Thursday, Sep 03",
                "title": "Marina & Beach Relaxation",
                "theme": "Leisure",
                "activities": [
                    {
                        "place_id": "p3_1",
                        "title": "Dubai Marina Yacht Cruise",
                        "location": "Dubai Marina",
                        "coordinates": {"lat": 25.0805, "lng": 55.1403},
                        "category": "Adventure",
                        "time": "10:00",
                        "end_time": "12:00",
                        "duration": "2 hr",
                        "duration_minutes": 120,
                        "estimated_cost": 45,
                        "is_outdoor": True
                    },
                    {
                        "place_id": "p3_2",
                        "title": "Mall of the Emirates Shopping",
                        "location": "Al Barsha",
                        "coordinates": {"lat": 25.1181, "lng": 55.2006},
                        "category": "Shopping",
                        "time": "13:00",
                        "end_time": "15:30",
                        "duration": "2 hr 30 min",
                        "duration_minutes": 150,
                        "estimated_cost": 0,
                        "is_outdoor": False
                    },
                    {
                        "place_id": "p3_3",
                        "title": "JBR The Beach",
                        "location": "JBR Walk",
                        "coordinates": {"lat": 25.0780, "lng": 55.1330},
                        "category": "Nature",
                        "time": "16:30",
                        "end_time": "19:00",
                        "duration": "2 hr 30 min",
                        "duration_minutes": 150,
                        "estimated_cost": 0,
                        "is_outdoor": True
                    }
                ]
            }
        ]
    }


class TestJourneyModificationEngine(unittest.TestCase):

    def setUp(self):
        self.trip_id = "test_trip_123"
        clear_revisions(self.trip_id)
        self.journey = get_mock_journey()

    def test_01_remove_park_and_add_rest(self):
        """Test 1: 'I don't want the park at 3 PM. I want to rest.'"""
        instruction = "Day 1: I don't want Zabeel Park at 3 PM. I want to rest at that time."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d1_acts = updated["days"][0]["activities"]
        has_rest = any(a.get("type") == "rest" or "Rest" in a.get("title", "") for a in d1_acts)
        has_park = any("Zabeel Park" in a.get("title", "") for a in d1_acts)
        
        self.assertTrue(has_rest, "Rest activity should be present in Day 1")
        self.assertFalse(has_park, "Zabeel Park should have been removed")
        # Day 2 and Day 3 should be preserved
        self.assertEqual(len(updated["days"][1]["activities"]), 4, "Day 2 activities count should be untouched")
        self.assertEqual(len(updated["days"][2]["activities"]), 3, "Day 3 activities count should be untouched")

    def test_02_replace_park_with_cafe(self):
        """Test 2: 'Replace the park with a nearby cafe.'"""
        instruction = "Day 1: Replace Zabeel Park with a cafe nearby."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d1_acts = updated["days"][0]["activities"]
        has_park = any("Zabeel Park" in a.get("title", "") for a in d1_acts)
        self.assertFalse(has_park)
        self.assertIsNotNone(summary)

    def test_03_insert_rest_block_after_lunch(self):
        """Test 3: 'Give me 2 hours of rest after lunch.'"""
        instruction = "Day 1: Give me 2 hours of rest after lunch."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d1_acts = updated["days"][0]["activities"]
        has_rest = any(a.get("type") == "rest" or "Rest" in a.get("title", "") for a in d1_acts)
        self.assertTrue(has_rest)

    def test_04_make_day_2_less_tiring(self):
        """Test 4: 'Make Day 2 less tiring.'"""
        instruction = "Make Day 2 less tiring and add free time."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d1_acts = updated["days"][0]["activities"]
        d2_acts = updated["days"][1]["activities"]
        
        # Day 1 must be unchanged
        self.assertEqual(len(d1_acts), 4)
        # Day 2 has rest or fewer stops
        has_rest = any(a.get("type") == "rest" or "Rest" in a.get("title", "") for a in d2_acts)
        self.assertTrue(has_rest)

    def test_05_remove_shopping_from_day_3(self):
        """Test 5: 'Remove shopping from Day 3.'"""
        instruction = "Remove Mall of the Emirates Shopping from Day 3."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d3_acts = updated["days"][2]["activities"]
        has_shopping = any("Mall of the Emirates" in a.get("title", "") for a in d3_acts)
        self.assertFalse(has_shopping)
        # Day 1 and Day 2 should be preserved
        self.assertEqual(len(updated["days"][0]["activities"]), 4)
        self.assertEqual(len(updated["days"][1]["activities"]), 4)

    def test_06_move_museum_to_day_3(self):
        """Test 6: 'Move the museum to Day 3.'"""
        instruction = "Move Dubai Museum & Al Fahidi from Day 2 to Day 3."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d2_acts = updated["days"][1]["activities"]
        d3_acts = updated["days"][2]["activities"]
        
        has_museum_d2 = any("Dubai Museum" in a.get("title", "") for a in d2_acts)
        has_museum_d3 = any("Dubai Museum" in a.get("title", "") for a in d3_acts)
        
        self.assertFalse(has_museum_d2, "Dubai Museum should be removed from Day 2")
        self.assertTrue(has_museum_d3, "Dubai Museum should be added to Day 3")

    def test_07_make_trip_cheaper(self):
        """Test 7: 'Make my trip cheaper.'"""
        instruction = "Make my trip cheaper and reduce expenses."
        prev_cost = self.journey["summary"]["estimated_total"]
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        new_cost = updated["summary"]["estimated_total"]
        self.assertLessEqual(new_cost, prev_cost)

    def test_08_optimize_day_2_route(self):
        """Test 8: 'Optimize Day 2 route.'"""
        instruction = "Optimize Day 2 route to reduce travel time."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        self.assertIsNotNone(updated["days"][1]["travel_distance"])

    def test_09_weather_indoor_replacement(self):
        """Test 9: 'It's going to rain tomorrow. Change outdoor activities.'"""
        instruction = "It's going to rain on Day 1. Replace outdoor activities with indoor alternatives."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        
        self.assertTrue(success)
        d1_acts = updated["days"][0]["activities"]
        # All modified stops should be indoor safe
        outdoor_count = sum(1 for a in d1_acts if a.get("is_outdoor") and not a.get("locked"))
        self.assertLessEqual(outdoor_count, 1)

    def test_10_undo_restoration(self):
        """Test 10: 'Undo that change.'"""
        original_d1_titles = [a["title"] for a in self.journey["days"][0]["activities"]]
        
        # 1. Apply a modification
        instruction = "Day 1: Remove Zabeel Park."
        success, updated, changes, summary, err = modify_journey_engine(self.trip_id, self.journey, instruction)
        self.assertTrue(success)
        
        # Verify Park is removed
        d1_titles_after = [a["title"] for a in updated["days"][0]["activities"]]
        self.assertNotIn("Zabeel Park", d1_titles_after)
        
        # 2. Undo the modification
        undo_instruction = "Undo that change."
        u_success, u_updated, u_changes, u_summary, u_err = modify_journey_engine(self.trip_id, updated, undo_instruction)
        
        self.assertTrue(u_success)
        d1_titles_restored = [a["title"] for a in u_updated["days"][0]["activities"]]
        self.assertEqual(original_d1_titles, d1_titles_restored, "Undo must restore exact original itinerary")


if __name__ == "__main__":
    unittest.main()
