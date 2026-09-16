SELECT '--- Truy van CHINH XAC nhu phpMyAdmin, bang user pma ---' AS buoc;
SELECT prefs FROM phpmyadmin.pma__table_uiprefs
WHERE username = 'root' AND db_name = 'kimdong_bookstore' AND table_name = 'banners';

SELECT '--- Kiem tra TUNG bang pma__ xem bang nao loi ---' AS buoc;
SELECT 'pma__bookmark' AS bang, COUNT(*) AS ok FROM phpmyadmin.pma__bookmark
UNION ALL SELECT 'pma__central_columns', COUNT(*) FROM phpmyadmin.pma__central_columns
UNION ALL SELECT 'pma__column_info', COUNT(*) FROM phpmyadmin.pma__column_info
UNION ALL SELECT 'pma__designer_settings', COUNT(*) FROM phpmyadmin.pma__designer_settings
UNION ALL SELECT 'pma__export_templates', COUNT(*) FROM phpmyadmin.pma__export_templates
UNION ALL SELECT 'pma__favorite', COUNT(*) FROM phpmyadmin.pma__favorite
UNION ALL SELECT 'pma__history', COUNT(*) FROM phpmyadmin.pma__history
UNION ALL SELECT 'pma__navigationhiding', COUNT(*) FROM phpmyadmin.pma__navigationhiding
UNION ALL SELECT 'pma__pdf_pages', COUNT(*) FROM phpmyadmin.pma__pdf_pages
UNION ALL SELECT 'pma__recent', COUNT(*) FROM phpmyadmin.pma__recent
UNION ALL SELECT 'pma__relation', COUNT(*) FROM phpmyadmin.pma__relation
UNION ALL SELECT 'pma__savedsearches', COUNT(*) FROM phpmyadmin.pma__savedsearches
UNION ALL SELECT 'pma__table_coords', COUNT(*) FROM phpmyadmin.pma__table_coords
UNION ALL SELECT 'pma__table_info', COUNT(*) FROM phpmyadmin.pma__table_info
UNION ALL SELECT 'pma__table_uiprefs', COUNT(*) FROM phpmyadmin.pma__table_uiprefs
UNION ALL SELECT 'pma__tracking', COUNT(*) FROM phpmyadmin.pma__tracking
UNION ALL SELECT 'pma__userconfig', COUNT(*) FROM phpmyadmin.pma__userconfig
UNION ALL SELECT 'pma__usergroups', COUNT(*) FROM phpmyadmin.pma__usergroups
UNION ALL SELECT 'pma__users', COUNT(*) FROM phpmyadmin.pma__users;
