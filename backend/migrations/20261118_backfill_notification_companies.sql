UPDATE notifications n
JOIN (
    SELECT user_id, MIN(company_id) AS company_id
    FROM company_user
    GROUP BY user_id
    HAVING COUNT(DISTINCT company_id) = 1
) single_company_users ON single_company_users.user_id = n.user_id
SET n.company_id = single_company_users.company_id
WHERE n.company_id IS NULL
  AND n.type IN (
      'booking',
      'booking_status',
      'booking_claimed',
      'booking_cancelled',
      'invoice_status'
  );

UPDATE notifications n
JOIN (
    SELECT notification_id, MIN(company_id) AS company_id
    FROM (
        SELECT n.id AS notification_id, cu.company_id
        FROM notifications n
        JOIN company_user cu ON cu.user_id = n.user_id
        JOIN roles r ON r.id = cu.role_id
        JOIN bookings b ON b.company_id = cu.company_id
        WHERE n.company_id IS NULL
          AND r.name IN ('owner', 'admin')
          AND (
              (n.type = 'booking_status'
                  AND n.message LIKE CONCAT('Booking #', b.reference, ' status changed to %'))
              OR (n.type = 'booking_claimed'
                  AND n.message LIKE CONCAT('% accept booking #', b.reference))
              OR (n.type = 'booking_cancelled'
                  AND n.message LIKE CONCAT('Booking #', b.reference, ' was cancelled by the customer%'))
          )

        UNION ALL

        SELECT n.id AS notification_id, cu.company_id
        FROM notifications n
        JOIN company_user cu ON cu.user_id = n.user_id
        JOIN roles r ON r.id = cu.role_id
        JOIN bookings b ON b.company_id = cu.company_id
        JOIN services s ON s.id = b.service_id
        WHERE n.company_id IS NULL
          AND n.type = 'booking'
          AND r.name IN ('owner', 'admin')
          AND n.message LIKE CONCAT(
              '% booked ',
              s.name,
              ' on ',
              DATE_FORMAT(b.booking_date, '%Y-%m-%d'),
              ' at ',
              DATE_FORMAT(b.start_time, '%H:%i'),
              '%'
          )

        UNION ALL

        SELECT n.id AS notification_id, cu.company_id
        FROM notifications n
        JOIN company_user cu ON cu.user_id = n.user_id
        JOIN roles r ON r.id = cu.role_id
        JOIN invoices i ON i.company_id = cu.company_id
        WHERE n.company_id IS NULL
          AND n.type = 'invoice_status'
          AND r.name IN ('owner', 'admin')
          AND n.message LIKE CONCAT('Invoice ', i.reference, ' status changed to %')
    ) candidates
    GROUP BY notification_id
    HAVING COUNT(DISTINCT company_id) = 1
) mapped ON mapped.notification_id = n.id
SET n.company_id = mapped.company_id
WHERE n.company_id IS NULL;
