def test_create_project(client, auth_headers):
    response = client.post("/api/projects", headers=auth_headers, json={
        "name": "Test Project",
        "key": "TEST",
        "description": "A test project"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["key"] == "TEST"
    assert data["description"] == "A test project"
    assert "id" in data

def test_list_projects(client, auth_headers):
    # Create a project first
    client.post("/api/projects", headers=auth_headers, json={
        "name": "Another Project",
        "key": "ANOT",
        "description": "Another test project"
    })
    
    response = client.get("/api/projects", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "issue_count" in data[0]
    assert "member_count" in data[0]

def test_get_project(client, auth_headers):
    # Create project
    create_response = client.post("/api/projects", headers=auth_headers, json={
        "name": "Get Test Project",
        "key": "GETP",
        "description": "Project for get test"
    })
    project_id = create_response.json()["id"]
    
    response = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Get Test Project"
    assert "members" in data
    assert len(data["members"]) == 1  # Creator should be a member

def test_add_project_member_unauthorized(client, auth_headers):
    # Create project
    create_response = client.post("/api/projects", headers=auth_headers, json={
        "name": "Member Test Project",
        "key": "MEMP",
        "description": "Project for member test"
    })
    project_id = create_response.json()["id"]
    
    # Create another user
    client.post("/api/auth/signup", json={
        "name": "Another User",
        "email": "another@example.com",
        "password": "password123"
    })
    
    # Login as the other user
    login_response = client.post("/api/auth/login", json={
        "email": "another@example.com",
        "password": "password123"
    })
    other_token = login_response.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    
    # Try to add member as non-maintainer (should fail)
    response = client.post(f"/api/projects/{project_id}/members", 
                          headers=other_headers,
                          json={"email": "test@example.com", "role": "member"})
    assert response.status_code == 403

def test_project_duplicate_key(client, auth_headers):
    # Create first project
    client.post("/api/projects", headers=auth_headers, json={
        "name": "First Project",
        "key": "DUPE",
        "description": "First project"
    })
    
    # Try to create with same key
    response = client.post("/api/projects", headers=auth_headers, json={
        "name": "Second Project",
        "key": "DUPE",
        "description": "Second project"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()
