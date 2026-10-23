<?php
$host = "{imap.gmail.com:993/imap/ssl}INBOX";
$username = "erzaqorrolli5@gmail.com";
$password = "iwaihsfdcuzekfui"; // App Password

$inbox = @imap_open($host, $username, $password);

if (!$inbox) {
    echo "❌ Lidhja dështoi: " . imap_last_error();
    exit;
}

echo "✅ Lidhja me Gmail u realizua!<br><br>";

// Merr të gjitha email-et (jo vetëm UNSEEN)
$emails = imap_search($inbox, 'ALL');

if ($emails) {
    rsort($emails); // Më të rejat në fillim
    $top5 = array_slice($emails, 0, 5);
    
    echo "<strong>5 email-et e fundit në Inbox:</strong><br><br>";
    
    foreach ($top5 as $id) {
        $header = imap_headerinfo($inbox, (int)$id);
        $from = $header->from[0]->mailbox . "@" . $header->from[0]->host;
        $subject = imap_utf8($header->subject);
        $isUnseen = in_array($id, imap_search($inbox, 'UNSEEN') ?: []);
        $status = $isUnseen ? "🔵 I PALEXUAR" : "⚪ I LEXUAR";
        
        echo "{$status} | Nga: <strong>{$from}</strong><br>";
        echo "Subjekti: {$subject}<br><hr>";
    }
} else {
    echo "Nuk ka email-e.";
}

imap_close($inbox);