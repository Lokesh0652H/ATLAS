def test_user_registration_and_login(client):
    # 1. Register a user
    reg_payload = {
        "email": "dr.elena@atlas.internal",
        "password": "UltraSecurePassword2026!",
        "full_name": "Dr. Elena Rostova"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "dr.elena@atlas.internal"
    assert reg_data["user"]["full_name"] == "Dr. Elena Rostova"

    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Duplicate registration rejected
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Authenticate with /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "dr.elena@atlas.internal"

    # 4. Login with correct credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": "dr.elena@atlas.internal",
        "password": "UltraSecurePassword2026!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 5. Login with invalid password fails
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "dr.elena@atlas.internal",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_workspace_isolation(client):
    # Register User A
    user_a_res = client.post("/api/v1/auth/register", json={
        "email": "user_a@atlas.internal",
        "password": "Password12345!",
        "full_name": "User Alpha"
    })
    token_a = user_a_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    user_b_res = client.post("/api/v1/auth/register", json={
        "email": "user_b@atlas.internal",
        "password": "Password12345!",
        "full_name": "User Beta"
    })
    token_b = user_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a private workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "Alpha Confidential Research"}, headers=headers_a)
    assert ws_res.status_code == 201
    ws_id = ws_res.json()["id"]

    # User A can access it
    ws_a_get = client.get(f"/api/v1/workspaces/{ws_id}", headers=headers_a)
    assert ws_a_get.status_code == 200
    assert ws_a_get.json()["name"] == "Alpha Confidential Research"

    # User B CANNOT access User A's workspace (strictly 403 Forbidden)
    ws_b_get = client.get(f"/api/v1/workspaces/{ws_id}", headers=headers_b)
    assert ws_b_get.status_code == 403
    assert "forbidden" in ws_b_get.json()["detail"].lower()
