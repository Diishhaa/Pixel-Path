"""
seed.py — Database seeder for demo courses and quizzes.
Run this to quickly populate your database with high-quality retro Python quests.
"""

import json
from database import engine
from sqlalchemy.orm import Session
from models import Base, Course, Node, Edge, Question

def seed_db():
    print("🌱 Starting database seeding process...")
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        # Check if course already exists to avoid duplication
        existing = db.query(Course).filter(Course.title == "Python Programming Quest").first()
        if existing:
            print("⚠️ Database already seeded with 'Python Programming Quest'. Skipping!")
            return

        # 1. Create Course
        course = Course(
            title="Python Programming Quest",
            description="Embark on a pixel-art journey to master Python variables, loops, and conditions!"
        )
        db.add(course)
        db.flush()

        print(f"✅ Created Course: {course.title} (ID={course.id})")

        # 2. Define Nodes
        # Node 1: Essential (Variables)
        n1 = Node(
            course_id=course.id,
            title="Variables & Data Types",
            youtube_url="https://www.youtube.com/watch?v=khKv-8q7YmY",
            node_type="essential",
            summary="Learn how to store text, numbers, and user inputs into variables.",
            order_index=0
        )
        # Node 1 Remedial: Remedial Variables
        n1_rem = Node(
            course_id=course.id,
            title="Remedial: Variables Recap",
            youtube_url="https://www.youtube.com/watch?v=vLqTf2b6GZw",
            node_type="remedial",
            summary="A simplified recap on variables naming rules and basic math operators.",
            order_index=1
        )
        # Node 2: Essential (Conditionals)
        n2 = Node(
            course_id=course.id,
            title="Conditionals & Logic",
            youtube_url="https://www.youtube.com/watch?v=Zp5MuPOgdQ0",
            node_type="essential",
            summary="Master decisions in your code using if, elif, and else statements.",
            order_index=2
        )
        # Node 2 Fast-Track: Fast-Track Logic
        n2_fast = Node(
            course_id=course.id,
            title="Fast-Track: Nested Decisions",
            youtube_url="https://www.youtube.com/watch?v=34wop38m17w",
            node_type="fast_track",
            summary="Learn advanced nested conditionals and compound logical conditions.",
            order_index=3
        )
        # Node 3: Essential (Loops)
        n3 = Node(
            course_id=course.id,
            title="Loops & Iterations",
            youtube_url="https://www.youtube.com/watch?v=6iF8Xb7Z3kQ",
            node_type="essential",
            summary="Write loops using while and for structures to repeat actions.",
            order_index=4
        )

        db.add_all([n1, n1_rem, n2, n2_fast, n3])
        db.flush()

        print(f"✅ Created {db.query(Node).filter(Node.course_id == course.id).count()} nodes")

        # 3. Add Questions
        # Node 1 Questions (Variables)
        q1_1 = Question(
            node_id=n1.id,
            level=1,
            q_type="mcq",
            question_text="Which of the following is an invalid variable name in Python?",
            options=json.dumps(["user_name", "user1", "1_user", "_user"]),
            correct_answer="1_user",
            xp_reward=10
        )
        q1_2 = Question(
            node_id=n1.id,
            level=2,
            q_type="fib",
            question_text="To convert a text input to a whole number in Python, use the ___ function.",
            options="[]",
            correct_answer="int",
            xp_reward=20
        )
        q1_3 = Question(
            node_id=n1.id,
            level=3,
            q_type="code",
            question_text="Find the syntax bug in this line:\n\nname = input(Enter your name: )",
            options="[]",
            correct_answer="name = input('Enter your name: ')",
            xp_reward=30
        )

        # Node 1 Remedial Questions
        q1r_1 = Question(
            node_id=n1_rem.id,
            level=1,
            q_type="mcq",
            question_text="What symbol is used for variable assignment in Python?",
            options=json.dumps(["=", "==", ":=", "->"]),
            correct_answer="=",
            xp_reward=10
        )
        q1r_2 = Question(
            node_id=n1_rem.id,
            level=2,
            q_type="fib",
            question_text="True and False belong to Python's ___ data type.",
            options="[]",
            correct_answer="bool",
            xp_reward=20
        )

        # Node 2 Questions (Conditionals)
        q2_1 = Question(
            node_id=n2.id,
            level=1,
            q_type="mcq",
            question_text="Which operator checks if two values are equal in Python?",
            options=json.dumps(["=", "==", "===", "is"]),
            correct_answer="==",
            xp_reward=10
        )
        q2_2 = Question(
            node_id=n2.id,
            level=2,
            q_type="fib",
            question_text="What keyword is short for 'else if' in Python?",
            options="[]",
            correct_answer="elif",
            xp_reward=20
        )
        q2_3 = Question(
            node_id=n2.id,
            level=3,
            q_type="code",
            question_text="Fix this conditional bug:\n\nif x = 10:\n    print('Equal')",
            options="[]",
            correct_answer="if x == 10:",
            xp_reward=30
        )

        # Node 2 Fast-Track Questions
        q2f_1 = Question(
            node_id=n2_fast.id,
            level=1,
            q_type="mcq",
            question_text="How do you combine two conditions where BOTH must be true?",
            options=json.dumps(["and", "or", "&&", "both"]),
            correct_answer="and",
            xp_reward=15
        )
        q2f_2 = Question(
            node_id=n2_fast.id,
            level=2,
            q_type="fib",
            question_text="The opposite of True in Python is boolean ___.",
            options="[]",
            correct_answer="False",
            xp_reward=25
        )

        # Node 3 Questions (Loops)
        q3_1 = Question(
            node_id=n3.id,
            level=1,
            q_type="mcq",
            question_text="Which keyword is used to skip the rest of the current iteration and go to the next loop cycle?",
            options=json.dumps(["break", "continue", "pass", "skip"]),
            correct_answer="continue",
            xp_reward=10
        )
        q3_2 = Question(
            node_id=n3.id,
            level=2,
            q_type="fib",
            question_text="To execute a loop block a fixed number of times, use the ___ function inside a 'for' statement.",
            options="[]",
            correct_answer="range",
            xp_reward=20
        )
        q3_3 = Question(
            node_id=n3.id,
            level=3,
            q_type="code",
            question_text="Fix this loop header syntax error:\n\nfor i in range(5)\n    print(i)",
            options="[]",
            correct_answer="for i in range(5):",
            xp_reward=30
        )

        db.add_all([
            q1_1, q1_2, q1_3,
            q1r_1, q1r_2,
            q2_1, q2_2, q2_3,
            q2f_1, q2f_2,
            q3_1, q3_2, q3_3
        ])
        db.flush()

        print(f"✅ Seeded {db.query(Question).count()} questions across all nodes.")

        # 4. Define Linear and Adaptive Edges
        # N1 -> N2 (pass condition)
        # N1 -> N1_Remedial (fail condition)
        # N1_Remedial -> N2 (pass condition)
        # N2 -> N3 (pass condition)
        # N2 -> N2_Fast (ace condition)
        # N2_Fast -> N3 (pass condition)
        e1 = Edge(from_node_id=n1.id, to_node_id=n2.id, condition="pass")
        e2 = Edge(from_node_id=n1.id, to_node_id=n1_rem.id, condition="fail")
        e3 = Edge(from_node_id=n1_rem.id, to_node_id=n2.id, condition="pass")
        e4 = Edge(from_node_id=n2.id, to_node_id=n3.id, condition="pass")
        e5 = Edge(from_node_id=n2.id, to_node_id=n2_fast.id, condition="ace")
        e6 = Edge(from_node_id=n2_fast.id, to_node_id=n3.id, condition="pass")

        db.add_all([e1, e2, e3, e4, e5, e6])
        db.commit()

        print("🔗 Successfully linked adaptive branching edges.")
        print("🎉 Database seeding complete! You are ready to quest.")

if __name__ == "__main__":
    seed_db()
