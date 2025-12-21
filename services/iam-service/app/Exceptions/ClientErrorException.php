<?php

namespace App\Exceptions;

use Exception;

class ClientErrorException extends Exception
{
    public function __construct($message)
    {
        parent::__construct($message);
    }
}

