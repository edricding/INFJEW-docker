/*
 Navicat Premium Dump SQL

 Source Server         : INFJEW
 Source Server Type    : MySQL
 Source Server Version : 80040 (8.0.40-google)
 Source Host           : 34.57.48.165:3306
 Source Schema         : infjew

 Target Server Type    : MySQL
 Target Server Version : 80040 (8.0.40-google)
 File Encoding         : 65001

 Date: 03/02/2026 10:24:31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for account
-- ----------------------------
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of account
-- ----------------------------
INSERT INTO `account` VALUES (1, 'dzh', '$2b$12$23v2S3j6o12Y0hIv0WynN.Tf9MPz/blVDpMNif57Mv.PvtI1J8h16\r\n$2b$12$23v2S3j6o12Y0hIv0WynN.Tf9MPz/blVDpMNif57Mv.PvtI1J8h16\r\n$2b$12$23v2S3j6o12Y0hIv0WynN.Tf9MPz/blVDpMNif57Mv.PvtI1J8h16');

-- ----------------------------
-- Table structure for banner
-- ----------------------------
DROP TABLE IF EXISTS `banner`;
CREATE TABLE `banner`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `picurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of banner
-- ----------------------------
INSERT INTO `banner` VALUES (1, 'New Collections', 'Coming up', 'Trending products of Summer 2025', 'https://www.baidu.com', 'https://storage.googleapis.com/bucket-infjew/Banner/test/hero-1.jpg');
INSERT INTO `banner` VALUES (2, 'Discover the Beauty of', 'Craftsmanship', 'Documentary Video Film', 'https://www.youtube.com', 'https://storage.googleapis.com/bucket-infjew/INFJEW/frontend/images/about/about-1.jpg');

-- ----------------------------
-- Table structure for countingDown
-- ----------------------------
DROP TABLE IF EXISTS `countingDown`;
CREATE TABLE `countingDown`  (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `price` int NOT NULL,
  `discount` int NOT NULL,
  `percentage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rating` int NOT NULL,
  `ddl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `picurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id` DESC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of countingDown
-- ----------------------------
INSERT INTO `countingDown` VALUES (1, 'Collection of Formless Stelluna', 999, 333, '-67%', 4, '2025/06/30', 'https://www.baidu.com', 'https://storage.googleapis.com/bucket-infjew/INFJEW/frontend/images/articles/a-3-3.jpg');

-- ----------------------------
-- Table structure for preciousList
-- ----------------------------
DROP TABLE IF EXISTS `preciousList`;
CREATE TABLE `preciousList`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `itemid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `price` int NOT NULL,
  `discount` int NOT NULL,
  `rating` int NOT NULL,
  `status` int NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `picurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of preciousList
-- ----------------------------
INSERT INTO `preciousList` VALUES (1, 'INF0125051701	', 'Premium | Round Cuts – Starless Stelluna Bracelet', 'Stelluna', 300, 300, 5, 0, 'https://store.infjew.com/INF-00-00000000', 'https://storage.googleapis.com/bucket-infjew/PreciousList/test/20250509-1.png');
INSERT INTO `preciousList` VALUES (2, 'INF0125051702', 'Intestine Cuts - Sparse Star Stelluna Bracelet', 'Stelluna', 300, 300, 1, 1, 'https://store.infjew.com/INF-00-00000001', 'https://storage.googleapis.com/bucket-infjew/PreciousList/test/20250509-2.png');
INSERT INTO `preciousList` VALUES (3, 'INF0125051703', 'Classic Cuts - Jade Frost Clarity Deep Green Stelluna Bracelet', 'Adornment', 299, 199, 5, 2, 'https://store.infjew.com/INF-00-00000002', 'https://storage.googleapis.com/bucket-infjew/PreciousList/test/20250509-3.png');

-- ----------------------------
-- Triggers structure for table banner
-- ----------------------------
DROP TRIGGER IF EXISTS `limit_banner_rows`;
delimiter ;;
CREATE TRIGGER `limit_banner_rows` BEFORE INSERT ON `banner` FOR EACH ROW BEGIN
    DECLARE total_rows INT;
    SELECT COUNT(*) INTO total_rows FROM banner;
    IF total_rows >= 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'banner 表最多只能有 3 条记录。';
    END IF;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table countingDown
-- ----------------------------
DROP TRIGGER IF EXISTS `limit_countingdown_rows`;
delimiter ;;
CREATE TRIGGER `limit_countingdown_rows` BEFORE INSERT ON `countingDown` FOR EACH ROW BEGIN
    DECLARE total_rows INT;
    SELECT COUNT(*) INTO total_rows FROM countingdown;
    IF total_rows >= 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'banner 表最多只能有 1 条记录。';
    END IF;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
