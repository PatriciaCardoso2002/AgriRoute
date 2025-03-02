import socket
import json
import requests

SERVER_HOST = "0.0.0.0"
SERVER_PORT = 65432
API_URL = "http://127.0.0.1:8000/notification"

def start_socket_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((SERVER_HOST, SERVER_PORT))
    server_socket.listen(5)
    print(f"Servidor socket rodando em {SERVER_HOST}:{SERVER_PORT}")

    while True:
        client_socket, addr = server_socket.accept()
        data = client_socket.recv(1024).decode()
        
        if data:
            notification = json.loads(data)
            requests.post(API_URL, json=notification)  
            
        client_socket.close()

if __name__ == "__main__":
    start_socket_server()
