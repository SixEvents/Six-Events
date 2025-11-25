import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { AvailabilityBadge, getAvailabilityInfo } from "@/lib/availability";

interface EventCardProps {
  title: string;
  image: string;
  date: string;
  location: string;
  price: string;
  spotsLeft: number;
  theme: string;
}

const EventCard = ({ title, image, date, location, price, spotsLeft, theme }: EventCardProps) => {
  const availabilityInfo = getAvailabilityInfo(spotsLeft);
  
  return (
    <Card className="overflow-hidden hover-lift group cursor-pointer border-2 border-border hover:border-primary transition-all">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          {theme}
        </Badge>
        {/* Badge de disponibilidade no canto superior esquerdo */}
        <div className="absolute top-3 left-3">
          <AvailabilityBadge availablePlaces={spotsLeft} />
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className={availabilityInfo.color}>
              {availabilityInfo.emoji} {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">{price}€</span>
            <span className="text-sm text-muted-foreground ml-1">/personne</span>
          </div>
          <Button 
            variant="hero" 
            size="sm"
            disabled={availabilityInfo.disabled}
          >
            {availabilityInfo.disabled ? 'Complet' : 'Réserver'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
