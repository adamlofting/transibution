CREATE TABLE `activities` (
  `happened_on` datetime NOT NULL,
  `user` varchar(500) DEFAULT NULL,
  `mozilla_team` varchar(255) DEFAULT NULL,
  UNIQUE KEY `happened_on` (`happened_on`,`user`,`mozilla_team`),
  KEY `idx` (`user`,`happened_on`,`mozilla_team`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
