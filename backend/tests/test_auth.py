def test_signup(client):
    response = client.post("/api/auth/signup", json={
        "name": "New User",
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert "id" in data
    assert "password" not in data

def test_signup_duplicate_email(client, test_user):
    # First signup is in conftest.py
    # Try to signup with same email
    response = client.post("/api/auth/signup", json=test_user)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

def test_login(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]

def test_get_me(client, auth_headers, test_user):
    response = client.get("/api/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["name"] == test_user["name"]

def test_get_me_unauthorized(client):
    response = client.get("/api/me")
    assert response.status_code == 403  # No auth header provided
