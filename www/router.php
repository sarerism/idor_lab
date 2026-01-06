<?php
// Simple router for development
$request = $_SERVER['REQUEST_URI'];
$request = strtok($request, '?'); // Remove query string

// Route handling
switch ($request) {
    case '/':
        require 'index.html';
        break;
    case '/about':
        require 'about.html';
        break;
    case '/about.html':
        require 'about.html';
        break;
    case '/innovation':
        require 'innovation.html';
        break;
    case '/innovation.html':
        require 'innovation.html';
        break;
    case '/contact':
        require 'contact.html';
        break;
    case '/contact.html':
        require 'contact.html';
        break;
    default:

        $file = __DIR__ . $request;
        if (file_exists($file) && is_file($file)) {
            return false; 
        } else {
            http_response_code(404);
            echo '404 - Not Found';
        }
        break;
}
