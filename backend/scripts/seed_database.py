import json
import os
import sys
from datetime import datetime, timedelta

# Ensure python path includes project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.database.session import engine, Base, SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.entities import (
    User, UserProfile, Ingredient, Recipe, RecipeIngredient,
    Nutrition, KitchenInventory, UserRating, UserInteraction,
    MLModelMetadata
)

def seed_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter_by(email="demo@autochef.com").first():
            print("Database already seeded with demo user.")
            return

        print("Seeding Users and Profiles...")
        demo_user = User(
            email="demo@autochef.com",
            hashed_password=get_password_hash("autochef123"),
            full_name="Alex Rivera",
            is_active=True,
            is_superuser=True
        )
        db.add(demo_user)
        db.flush()

        demo_profile = UserProfile(
            user_id=demo_user.id,
            dietary_preferences=["vegetarian"],
            allergies=["peanut"],
            disliked_ingredients=[],
            preferred_cuisines=["Italian", "Mediterranean", "Asian"],
            max_cooking_time=45,
            skill_level="intermediate",
            calorie_target=2000.0
        )
        db.add(demo_profile)

        # Seed additional users for collaborative filtering
        for i in range(2, 9):
            user = User(
                email=f"user{i}@autochef.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"Chef Tester {i}",
                is_active=True
            )
            db.add(user)
            db.flush()
            profile = UserProfile(
                user_id=user.id,
                dietary_preferences=[] if i % 2 == 0 else ["vegetarian"],
                allergies=["milk"] if i == 3 else [],
                preferred_cuisines=["Italian", "Mexican", "Asian"]
            )
            db.add(profile)

        print("Seeding USDA Nutrition and Ingredients...")
        nutrition_file = os.path.join(os.path.dirname(__file__), "../datasets/nutrition/usda_nutrition.json")
        with open(nutrition_file, "r") as f:
            nutrition_data = json.load(f)

        ingredient_map = {}
        for ing_name, data in nutrition_data.items():
            ing = Ingredient(
                name=ing_name,
                normalized_name=ing_name.lower().strip(),
                category=data.get("category", "ingredient"),
                common_allergens=["dairy"] if ing_name in ["parmesan", "heavy cream", "butter", "cheese"]
                                 else ["soy"] if ing_name in ["tofu", "soy sauce"]
                                 else ["egg"] if ing_name == "egg"
                                 else ["wheat"] if ing_name in ["pasta", "bread"]
                                 else ["fish"] if ing_name == "salmon"
                                 else [],
                dietary_flags={
                    "is_vegetarian": ing_name not in ["chicken breast", "salmon", "beef"],
                    "is_vegan": ing_name not in ["chicken breast", "salmon", "beef", "parmesan", "heavy cream", "butter", "cheese", "egg"],
                    "is_gluten_free": ing_name not in ["pasta", "bread", "soy sauce"]
                },
                default_unit="g",
                average_shelf_life_days=14 if data.get("category") == "dairy" else 7
            )
            db.add(ing)
            db.flush()
            ingredient_map[ing.normalized_name] = ing.id

            nutr = Nutrition(
                ingredient_id=ing.id,
                serving_size_g=100.0,
                calories=data.get("calories", 0.0),
                protein=data.get("protein", 0.0),
                carbohydrates=data.get("carbohydrates", 0.0),
                fat=data.get("fat", 0.0),
                fiber=data.get("fiber", 0.0),
                sugar=data.get("sugar", 0.0),
                sodium=data.get("sodium", 0.0),
                source=data.get("source", "USDA FoodData Central")
            )
            db.add(nutr)

        print("Seeding Recipes Catalog...")
        recipes_file = os.path.join(os.path.dirname(__file__), "../datasets/recipes/recipes_catalog.json")
        with open(recipes_file, "r") as f:
            recipes_data = json.load(f)

        for r_data in recipes_data:
            recipe = Recipe(
                title=r_data["title"],
                cuisine=r_data["cuisine"],
                category=r_data["category"],
                prep_time=r_data["prep_time"],
                cook_time=r_data["cook_time"],
                total_time=r_data["total_time"],
                servings=r_data["servings"],
                difficulty=r_data["difficulty"],
                description=r_data["description"],
                image_url=r_data["image_url"],
                tags=r_data["tags"],
                dietary_flags=r_data["dietary_flags"],
                allergens=r_data["allergens"],
                calories=r_data["calories"],
                protein=r_data["protein"],
                carbs=r_data["carbs"],
                fat=r_data["fat"],
                fiber=r_data["fiber"],
                sugar=r_data["sugar"],
                sodium=r_data["sodium"],
                instructions=r_data["instructions"],
                is_verified=True
            )
            db.add(recipe)
            db.flush()

            for ing_item in r_data["ingredients"]:
                norm_name = ing_item["name"].lower().strip()
                ing_id = ingredient_map.get(norm_name)
                if not ing_id:
                    # Create on the fly if not in nutrition table
                    new_ing = Ingredient(
                        name=ing_item["name"],
                        normalized_name=norm_name,
                        category="pantry"
                    )
                    db.add(new_ing)
                    db.flush()
                    ing_id = new_ing.id
                    ingredient_map[norm_name] = ing_id

                rec_ing = RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ing_id,
                    amount=ing_item["amount"],
                    unit=ing_item["unit"],
                    original_text=ing_item.get("original_text", f"{ing_item['amount']} {ing_item['unit']} {ing_item['name']}")
                )
                db.add(rec_ing)

        print("Seeding Demo Kitchen Inventory...")
        inventory_items = [
            ("pasta", 500, "g", 120),
            ("tomato", 6, "items", 4),
            ("garlic", 1, "bulb", 30),
            ("olive oil", 500, "ml", 180),
            ("basil", 1, "bunch", 3),
            ("parmesan", 200, "g", 21),
            ("avocado", 2, "items", 2),
            ("egg", 6, "items", 14),
            ("onion", 4, "items", 15)
        ]
        now = datetime.utcnow()
        for ing_name, qty, unit, exp_days in inventory_items:
            ing_id = ingredient_map.get(ing_name)
            if ing_id:
                inv = KitchenInventory(
                    user_id=demo_user.id,
                    ingredient_id=ing_id,
                    quantity=qty,
                    unit=unit,
                    purchase_date=now - timedelta(days=2),
                    expiry_date=now + timedelta(days=exp_days)
                )
                db.add(inv)

        print("Seeding User Interactions & Ratings...")
        interactions_file = os.path.join(os.path.dirname(__file__), "../datasets/interactions/user_interactions.json")
        with open(interactions_file, "r") as f:
            interactions_data = json.load(f)

        weight_map = {"view": 1.0, "like": 2.0, "save": 3.0, "cook": 5.0, "skip": -1.0}
        for item in interactions_data:
            interaction = UserInteraction(
                user_id=item["user_id"],
                recipe_id=item["recipe_id"],
                interaction_type=item["interaction"],
                weight=weight_map.get(item["interaction"], 1.0),
                created_at=now - timedelta(days=item["user_id"])
            )
            db.add(interaction)

            if item["rating"] > 0:
                rating = UserRating(
                    user_id=item["user_id"],
                    recipe_id=item["recipe_id"],
                    rating=item["rating"],
                    review="Delicious and easy to prepare." if item["rating"] >= 4.0 else "Needs more seasoning.",
                    created_at=now - timedelta(days=item["user_id"])
                )
                db.add(rating)

        print("Registering Initial ML Model Metadata...")
        modules = [
            ("ingredient_detection", "YOLOv8 Ingredient Detector", "8.0-nano", "Untrained", "OpenImages / Demo Dataset", 1200),
            ("recipe_recommendation", "Hybrid TF-IDF & Weighted Ingredient Recommender", "2.1-hybrid", "Trained", "AutoChef Curated Recipe Corpus", 250),
            ("collaborative_filtering", "Item-Based & User-Based Interaction Filter", "1.4-cf", "Trained", "AutoChef Interaction Log", 45),
            ("preference_prediction", "RandomForest & XGBoost User Preference Classifier", "1.2-ensemble", "Trained", "Culinary Interaction Matrix", 180),
            ("ingredient_substitution", "Context-Aware Semantic Substitution Engine", "1.0-nlp", "Trained", "Food Ontology & Culinary Role Graph", 95),
            ("nutrition_estimation", "USDA FoodData Central Nutritional Aggregator", "1.0-usda", "Trained", "USDA FoodData Central SR Legacy", 8200)
        ]
        for mod, name, ver, stat, src, size in modules:
            meta = MLModelMetadata(
                module_name=mod,
                model_name=name,
                model_version=ver,
                training_status=stat,
                dataset_source=src,
                dataset_size=size,
                metrics={
                    "status": "Initialized",
                    "evaluation_ready": True
                },
                last_evaluated_at=now
            )
            db.add(meta)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
