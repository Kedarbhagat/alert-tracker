#!/usr/bin/env python3
"""
Backend Connection Test Script
Run this to verify your backend is working correctly
"""

import requests
import json
import sys

# Update this to match your backend URL
BACKEND_URL = "http://localhost:5000"

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def test_endpoint(name, method, endpoint, data=None):
    url = f"{BACKEND_URL}{endpoint}"
    print(f"\n🧪 Testing: {name}")
    print(f"   URL: {url}")
    
    try:
        if method == "POST":
            response = requests.post(url, json=data, timeout=5)
        else:
            response = requests.get(url, timeout=5)
        
        print(f"   Status: {response.status_code}")
        
        if response.ok:
            print(f"   ✅ SUCCESS")
            try:
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"   Response: {response.text[:200]}")
        else:
            print(f"   ❌ FAILED")
            print(f"   Error: {response.text[:200]}")
        
        return response.ok
    
    except requests.exceptions.ConnectionError:
        print(f"   ❌ CONNECTION FAILED")
        print(f"   Cannot connect to {BACKEND_URL}")
        print(f"   Is the backend running?")
        return False
    
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def main():
    print_header("Backend Connection Test")
    print(f"Testing backend at: {BACKEND_URL}")
    print("Make sure your Flask backend is running!")
    
    results = []
    
    # Test 1: Check active shift
    results.append(test_endpoint(
        "Check Active Shift",
        "POST",
        "/check-active-shift",
        {"agent_id": "test-uuid", "agent_name": "Test Agent"}
    ))
    
    # Test 2: Start shift
    results.append(test_endpoint(
        "Start Shift",
        "POST",
        "/start-shift",
        {"agent_id": "test-uuid"}
    ))
    
    # Test 3: Update triage (will fail if no shift, but tests endpoint)
    results.append(test_endpoint(
        "Update Triage",
        "POST",
        "/update-triage",
        {"shift_id": 1, "change": 1}
    ))
    
    print_header("Test Summary")
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total} tests")
    
    if passed == total:
        print("✅ All tests passed! Backend is working correctly.")
    elif passed > 0:
        print("⚠️ Some tests passed. Backend is running but may have issues.")
        print("   Check the errors above for details.")
    else:
        print("❌ All tests failed. Backend is not responding.")
        print("\nTroubleshooting:")
        print("1. Is Flask running? Check with: ps aux | grep python")
        print("2. Is it on the correct port? Should show: Running on http://0.0.0.0:5000")
        print("3. Try starting it: python app.py")
        print(f"4. Check the URL is correct: {BACKEND_URL}")

if __name__ == "__main__":
    main()