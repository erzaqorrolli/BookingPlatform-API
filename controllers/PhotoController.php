<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Photo;
use App\Models\Company;

class PhotoController
{
    private const UPLOAD_DIR = __DIR__ . '/../storage/uploads/';
    private const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    /**
     * GET /api/companies/{companyId}/photos
     */
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $photos = Photo::forCompany($companyId);
        json_ok(array_map(fn($p) => $p->toArray(), $photos));
    }

    /**
     * POST /api/companies/{companyId}/photos
     * multipart/form-data: photo (file), is_cover (0/1)
     */
    public function upload(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        if (empty($_FILES['photo'])) {
            json_err('No file uploaded', 422);
        }

        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_err('Upload error: ' . $file['error'], 422);
        }

        if ($file['size'] > self::MAX_SIZE) {
            json_err('File too large (max 5MB)', 422);
        }

        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, self::ALLOWED_TYPES)) {
            json_err('Invalid file type. Allowed: JPG, PNG, WEBP, GIF', 422);
        }

        $duplicate = Photo::findDuplicateByContent($companyId, $file['tmp_name']);
        if ($duplicate) {
            json_ok([
                'message' => 'Fotoja ekziston tashmë',
                'photo'   => $duplicate->toArray(),
            ]);
        }

        // Gjenero emër unik
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = uniqid('img_', true) . '.' . $ext;

        // Krijo folderin nëse s'ekziston
        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $destination = self::UPLOAD_DIR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            json_err('Failed to save file', 500);
        }

        $isCover = !empty($_POST['is_cover']) && $_POST['is_cover'] !== '0';

        $photo = Photo::create($companyId, [
            'filename'      => $filename,
            'original_name' => $file['name'],
            'mime_type'     => $mime,
            'size'          => $file['size'],
            'is_cover'      => $isCover ? 1 : 0,
        ]);

        json_ok([
            'message' => 'Foto u ngarkua',
            'photo'   => $photo->toArray(),
        ], 201);
    }

    /**
     * PUT /api/companies/{companyId}/photos/{id}/cover
     */
    public function setCover(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $photo = Photo::findById($id);
        if (!$photo || $photo->company_id !== $companyId) {
            json_err('Photo not found', 404);
        }

        $photo->setAsCover();

        json_ok(['message' => 'Foto u bë cover']);
    }

    /**
     * DELETE /api/companies/{companyId}/photos/{id}
     */
    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $photo = Photo::findById($id);
        if (!$photo || $photo->company_id !== $companyId) {
            json_err('Photo not found', 404);
        }

        $photo->delete();

        json_ok(['message' => 'Foto u fshi']);
    }
}