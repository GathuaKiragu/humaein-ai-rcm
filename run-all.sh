#!/bin/bash

# Script to run all Humaein RCM services concurrently
# Usage: ./run-all.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Humaein AI RCM Platform...${NC}"
echo ""

# Function to kill all background processes on script exit
cleanup() {
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if required commands are available
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

check_command "node"
check_command "npm"
check_command "python3"
check_command "pip3"

# Function to run a service with colored output
run_service() {
    local service_name=$1
    local color=$2
    local command=$3
    local log_file="$service_name.log"
    
    echo -e "${color}Starting $service_name...${NC}"
    cd $service_name
    # Run the command, save output to log file, and also show with prefix
    eval $command 2>&1 | awk -v service="$service_name" -v color="$color" -v nc="$NC" '{print color "[" service "] " nc $0}' &
    cd ..
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Run Backend Service (Node.js)
run_service "backend" "$GREEN" "npm run dev"

# Wait a moment for backend to start before continuing
sleep 3

# Run AI Service (Python)
# Check if virtual environment exists, if not create it
if [ ! -d "ai-service/venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    cd ai-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn openai python-multipart python-dotenv pillow pytesseract
    deactivate
    cd ..
fi

run_service "ai-service" "$BLUE" "source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Wait a moment for AI service to start
sleep 3

# Run Frontend Service (React)
run_service "frontend" "$YELLOW" "npm run dev"

echo ""
echo -e "${GREEN}All services started!${NC}"
echo -e "${GREEN}Frontend:    http://localhost:5173${NC}"
echo -e "${GREEN}Backend API: http://localhost:5000${NC}"
echo -e "${GREEN}AI Service:  http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes
wait