CREATE TABLE `activities` (
  `happened_on` datetime NOT NULL,
  `user` varchar(255) DEFAULT NULL,
  `mozilla_team` varchar(50) DEFAULT NULL,
  UNIQUE KEY `happened_on` (`happened_on`,`user`,`mozilla_team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
