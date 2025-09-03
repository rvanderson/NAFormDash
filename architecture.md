# Architecture Document

This document outlines the architecture for the Form Dashboard application.

## Tech Stack

*   **Build Tool**: Vite
*   **Frontend Framework**: React
*   **Styling**: Tailwind CSS
*   **Form Rendering**: SurveyJS Library
*   **Form Creation**: SurveyJS Creator (to be added)
*   **AI-Powered Form Generation**: Custom backend service calling a GPT API.

## Project Structure

*(To be filled in as the project is built)*

## Backend Services

### GPT Form Generation Service

*   **Endpoint**: `/api/generate-survey`
*   **Method**: `POST`
*   **Request Body**: `{ "prompt": "Your form description here" }`
*   **Response**: SurveyJS JSON schema.
