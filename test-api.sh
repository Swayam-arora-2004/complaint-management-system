#!/bin/bash

# Quick API Test Script
# This script tests the backend API endpoints

API_BASE="http://localhost:5001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Complaint Management API${NC}\n"

# Test 1: Health Check
echo -e "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s "$API_BASE/../health")
if echo "$HEALTH" | grep -q "OK"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: Register User
echo -e "\n2️⃣  Registering Test User..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "ok.*true"; then
    echo -e "${GREEN}✅ User registered successfully${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "   Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# Test 3: Get Complaints (should be empty)
echo -e "\n3️⃣  Fetching Complaints..."
COMPLAINTS=$(curl -s -X GET "$API_BASE/complaints" \
  -H "Authorization: Bearer $TOKEN")

if echo "$COMPLAINTS" | grep -q "ok.*true"; then
    echo -e "${GREEN}✅ Fetched complaints successfully${NC}"
else
    echo -e "${RED}❌ Failed to fetch complaints${NC}"
    echo "$COMPLAINTS"
    exit 1
fi

# Test 4: Create Complaint
echo -e "\n4️⃣  Creating Test Complaint..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/complaints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Complaint",
    "category": "technical",
    "priority": "high",
    "description": "This is a test complaint created by the test script"
  }')

if echo "$CREATE_RESPONSE" | grep -q "ok.*true"; then
    echo -e "${GREEN}✅ Complaint created successfully${NC}"
    COMPLAINT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo -e "   Complaint ID: $COMPLAINT_ID"
else
    echo -e "${RED}❌ Failed to create complaint${NC}"
    echo "$CREATE_RESPONSE"
    exit 1
fi

# Test 5: Get Specific Complaint
if [ ! -z "$COMPLAINT_ID" ]; then
    echo -e "\n5️⃣  Fetching Complaint Details..."
    DETAILS=$(curl -s -X GET "$API_BASE/complaints/$COMPLAINT_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DETAILS" | grep -q "ok.*true"; then
        echo -e "${GREEN}✅ Fetched complaint details successfully${NC}"
    else
        echo -e "${RED}❌ Failed to fetch complaint details${NC}"
    fi
fi

# Test 6: Add Comment
if [ ! -z "$COMPLAINT_ID" ]; then
    echo -e "\n6️⃣  Adding Comment..."
    COMMENT_RESPONSE=$(curl -s -X POST "$API_BASE/complaints/$COMPLAINT_ID/comments" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "text": "This is a test comment"
      }')
    
    if echo "$COMMENT_RESPONSE" | grep -q "ok.*true"; then
        echo -e "${GREEN}✅ Comment added successfully${NC}"
    else
        echo -e "${RED}❌ Failed to add comment${NC}"
    fi
fi

# Test 7: Update Status
if [ ! -z "$COMPLAINT_ID" ]; then
    echo -e "\n7️⃣  Updating Complaint Status..."
    STATUS_RESPONSE=$(curl -s -X PATCH "$API_BASE/complaints/$COMPLAINT_ID/status" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "in-progress"
      }')
    
    if echo "$STATUS_RESPONSE" | grep -q "ok.*true"; then
        echo -e "${GREEN}✅ Status updated successfully${NC}"
    else
        echo -e "${RED}❌ Failed to update status${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 All API tests completed!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Start frontend: npm run dev"
echo "2. Open http://localhost:5173"
echo "3. Login with the test user credentials"
echo "4. Check the dashboard for your test complaint"

