<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Notification;

class NotificationController{

public function index(): void{

$uid=auth_user_id();
if(!$uid)json_err('Unauthorized',401);
$notifications = Notification::forUser($uid,100);
$unreadCount=Notification::unreadCount($uid);

json_ok([

'notifications'=>$notifications,
'unread_count'=>$unreadCount,
]);
}

public function unreadCount():void{

$uid=auth_user_id();
if(!$uid) json_err('Unauthorized',401);

json_ok([
'unread_count'=>Notification::unreadCount($uid),


]);
}


public function markAsRead(array $params): void{
    $uid= auth_user_id();
    if(!$uid)json_err('Unauthorized',401);

    $id=(int)($params['id'] ?? 0);
    if(!$id) json_err('Notification ID required',422);

    Notification::markAsRead($id,$uid);
    json_ok(['message' =>'Mark as read']);
}

public function markAllAsRead(): void{

$uid=auth_user_id();
if(!$uid) json_err('Unauthorized',401);

Notification::markAllAsRead($uid);
json_ok(['message' => 'All marked as read']);
}

public function destroy (array $params): void{

$uid=auth_user_id();

if(!$uid)json_err('Unauthorized',401);

$id = (int) ($params['id'] ?? 0);
if(!$id) json_err('Notifications ID required',422);

Notification::delete($id,$uid);
json_ok(['message' =>'Notification deleted']);
}
}
