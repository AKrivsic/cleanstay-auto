<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $to = "info@cleanstay.cz"; // nahraď vlastním e-mailem
    $subject = "Nová zpráva z kontaktního formuláře (footer)";
    $name = htmlspecialchars($_POST["name"]);
    $email = htmlspecialchars($_POST["email"]);
    $message = htmlspecialchars($_POST["message"]);

    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    $body = "Jméno: $name\nE-mail: $email\nZpráva:\n$message";

    if (mail($to, $subject, $body, $headers)) {
        echo "Zpráva byla odeslána.";
    } else {
        echo "Došlo k chybě při odeslání.";
    }
} else {
    echo "Neplatná metoda.";
}
