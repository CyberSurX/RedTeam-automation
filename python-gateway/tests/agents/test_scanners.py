import pytest
from unittest.mock import patch, MagicMock
from agents.red_team.web_scanner import WebScanner
from agents.red_team.network_scanner import NetworkScanner

def test_web_scanner_validate_url():
    scanner = WebScanner()
    valid, url = scanner.validate_url("example.com")
    assert valid is True
    assert url == "https://example.com"
    
    valid, url = scanner.validate_url("http://test.com")
    assert valid is True
    assert url == "http://test.com"

@patch('requests.Session.head')
def test_web_scanner_headers(mock_head):
    mock_response = MagicMock()
    mock_response.headers = {'Strict-Transport-Security': 'max-age=31536000'}
    mock_head.return_value = mock_response
    
    scanner = WebScanner()
    headers_analysis = scanner.check_security_headers("https://example.com")
    
    # It should report that X-Frame-Options is missing
    missing_x_frame = [h for h in headers_analysis if h.name == 'X-Frame-Options']
    assert len(missing_x_frame) == 1
    assert missing_x_frame[0].present is False

def test_network_scanner_validate_target():
    scanner = NetworkScanner()
    valid, ip, host = scanner.validate_target("http://example.com")
    assert valid is True
    # Should strip the protocol and parse properly
    
    # For a direct domain
    valid, ip, host = scanner.validate_target("localhost")
    assert valid is True

@patch('socket.socket.connect_ex')
def test_network_scanner_scan_port(mock_connect):
    # Mocking open port
    mock_connect.return_value = 0
    scanner = NetworkScanner()
    
    result = scanner.scan_port("127.0.0.1", 80)
    assert result.status == 'open'
    assert result.port == 80
    
    # Mocking closed port
    mock_connect.return_value = 111
    result = scanner.scan_port("127.0.0.1", 80)
    assert result.status == 'closed'
